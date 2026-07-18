import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface SendToMakeRequest {
  leadId: string
  eventType: 'lead_created' | 'partner_assigned' | 'manual_send'
  overridePayload?: any
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify user authentication and superadmin role
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      throw new Error('Invalid authentication')
    }

    // Check if user is superadmin
    const { data: isSuperAdmin } = await supabase.rpc('is_superadmin', { 
      user_id_param: user.id 
    })
    
    if (!isSuperAdmin) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Superadmin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { leadId, eventType, overridePayload }: SendToMakeRequest = await req.json()

    if (!leadId || !eventType) {
      throw new Error('Missing required fields: leadId, eventType')
    }

    // Check if Make.com integration is enabled
    const { data: settings, error: settingsError } = await supabase
      .from('make_integration_settings')
      .select('enabled, event_toggles, webhook_url, field_mappings, spreadsheet_format')
      .single()

    if (settingsError) {
      console.error('Failed to fetch Make settings:', settingsError)
      throw new Error('Failed to fetch integration settings')
    }

    if (!settings.enabled && eventType !== 'manual_send') {
      return new Response(
        JSON.stringify({ error: 'Make.com integration is disabled' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if specific event type is enabled (unless manual send)
    const eventToggles = settings.event_toggles || {}
    if (eventType !== 'manual_send' && !eventToggles[eventType]) {
      return new Response(
        JSON.stringify({ error: `Event type '${eventType}' is disabled` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch lead data with related information
    const { data: lead, error: leadError } = await supabase
      .from('quiz_responses')
      .select(`
        *,
        lead_assignments(
          partner_id,
          partners(id, name, email, company_name)
        )
      `)
      .eq('id', leadId)
      .single()

    if (leadError || !lead) {
      throw new Error('Lead not found')
    }

    // Fetch USA application data with all fields for bundling
    const { data: usaApplication } = await supabase
      .from('usa_applications')
      .select('*')
      .eq('quiz_response_id', leadId)
      .single()

    // Fetch Canadian application data with all fields for bundling
    const { data: canadianApplication } = await supabase
      .from('canadian_applications')
      .select('*')
      .eq('quiz_response_id', leadId)
      .single()

    // Get field mappings from settings
    const fieldMappings = settings.field_mappings || {}
    const leadFields = fieldMappings.lead_fields || {}
    const partnerFields = fieldMappings.partner_fields || {}
    const applicationFields = fieldMappings.application_fields || {}
    const metadataFields = fieldMappings.metadata_fields || {}

    // Helper function to filter object by field mappings
    const filterFields = (obj: any, mappings: Record<string, boolean>) => {
      const filtered: any = {}
      Object.keys(mappings).forEach(key => {
        if (mappings[key] && obj[key] !== undefined) {
          filtered[key] = obj[key]
        }
      })
      return filtered
    }

    // Helper function to transform data to spreadsheet format
    const transformToSpreadsheetFormat = (lead: any, partner: any, usaApp: any, canadianApp: any) => {
      // Split name into first and last
      const nameParts = (lead.name || '').split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Clean phone numbers to 10 digits only
      const cleanPhone = (phone: string) => {
        if (!phone) return '';
        const digits = phone.replace(/[^0-9]/g, '');
        return digits.length >= 10 ? digits.slice(-10) : digits;
      };

      // Format date to DD/MM/YYYY
      const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      };

      // Map time_in_business to integer years
      const mapTimeInBusiness = (timeStr: string) => {
        if (!timeStr) return '';
        switch (timeStr.toLowerCase()) {
          case 'less-than-1': case '<1': return '0';
          case '1-2': return '1';
          case '2-5': return '3';
          case '5+': case '+5': return '5';
          case '6-12': return '1';
          default: return '';
        }
      };

      // Map entity type based on application data or default
      const getEntityType = () => {
        const appData = canadianApp || usaApp;
        if (appData?.type_of_entity) {
          switch (appData.type_of_entity.toLowerCase()) {
            case 'sole_proprietorship': return 'Sole Proprietorship';
            case 'corporation': return 'Corporation';
            case 'limited_partnership': return 'Limited Partnership';
            case 'partnership': return 'Partnership';
            case 'general_partnership': return 'General Partnership';
            default: return 'Sole Proprietorship';
          }
        }
        return '';
      };

      // Map use_of_funds to industry
      const mapIndustry = (useOfFunds: string) => {
        if (!useOfFunds) return '';
        const use = useOfFunds.toLowerCase();
        if (use.includes('auto') || use.includes('vehicle')) return 'Auto-Related';
        if (use.includes('construction') || use.includes('contractor')) return 'Construction';
        if (use.includes('food') || use.includes('restaurant')) return 'Food & Beverage';
        if (use.includes('beauty') || use.includes('salon')) return 'Hair & Beauty';
        if (use.includes('health') || use.includes('medical')) return 'Health';
        if (use.includes('professional') || use.includes('service')) return 'Professional Services';
        if (use.includes('recreation') || use.includes('entertainment')) return 'Recreation';
        if (use.includes('retail') || use.includes('store')) return 'Retail';
        if (use.includes('transport')) return 'Transportation';
        return 'Other';
      };

      // Get province/state mapping for Canada
      const mapProvince = (province: string) => {
        if (!province) return '';
        const prov = province.toLowerCase();
        if (prov.includes('british') || prov.includes('bc')) return 'BC';
        if (prov.includes('alberta') || prov.includes('ab')) return 'AB';
        if (prov.includes('saskatchewan') || prov.includes('sk')) return 'SK';
        if (prov.includes('manitoba') || prov.includes('mb')) return 'MB';
        if (prov.includes('ontario') || prov.includes('on')) return 'ON';
        if (prov.includes('quebec') || prov.includes('qc')) return 'QC';
        if (prov.includes('new brunswick') || prov.includes('nb')) return 'NB';
        if (prov.includes('nova scotia') || prov.includes('ns')) return 'NS';
        if (prov.includes('prince edward') || prov.includes('pe')) return 'PE';
        if (prov.includes('newfoundland') || prov.includes('nl')) return 'NL';
        if (prov.includes('yukon') || prov.includes('yt')) return 'YT';
        if (prov.includes('northwest') || prov.includes('nt')) return 'NT';
        if (prov.includes('nunavut') || prov.includes('nu')) return 'NU';
        return province.toUpperCase();
      };

    // Use application data where available, fallback to lead data
      const appData = canadianApp || usaApp;
      
      // Collect all file URLs from both applications
      const collectFileUrls = () => {
        const allFiles: string[] = [];
        
        // Helper to convert files to URLs
        const convertToUrls = (files: any[]) => {
          if (!Array.isArray(files)) return [];
          return files.map(file => {
            if (typeof file === 'string') {
              return `${supabaseUrl}/storage/v1/object/public/application-documents/${file}`;
            }
            if (file?.name) {
              return `${supabaseUrl}/storage/v1/object/public/application-documents/${file.name}`;
            }
            return file;
          }).filter(url => url && typeof url === 'string');
        };
        
        // Collect from both USA and Canadian applications
        [usaApp, canadianApp].forEach(app => {
          if (app?.document_files) {
            allFiles.push(...convertToUrls(app.document_files));
          }
          if (app?.processing_statements) {
            allFiles.push(...convertToUrls(app.processing_statements));
          }
        });
        
        return allFiles.join(', ');
      };
      
      // Count total files
      const countFiles = () => {
        let count = 0;
        [usaApp, canadianApp].forEach(app => {
          if (app?.document_files && Array.isArray(app.document_files)) {
            count += app.document_files.length;
          }
          if (app?.processing_statements && Array.isArray(app.processing_statements)) {
            count += app.processing_statements.length;
          }
        });
        return count;
      };
      
      return {
        "First Name": firstName,
        "Last Name": lastName,
        "Company": lead.company_name || appData?.legal_business_name || '',
        "Email": lead.email || appData?.email_address || '',
        "Mobile! (10 digits only)": cleanPhone(lead.phone || appData?.cell_phone || ''),
        "Phone! (10 digits only)": cleanPhone(appData?.business_phone || lead.phone || ''),
        "Date of Birth (DD/MM/YYYY)": appData?.dob ? formatDate(appData.dob) : '',
        "Language!": lead.country === 'CA' ? 'English' : 'English',
        "Requested Amount! (Currency)": lead.loan_amount || appData?.amount_requested || '',
        "Annual Revenue! (Currency)": appData?.annual_gross_sales || (lead.monthly_revenue * 12) || '',
        "Estimated Monthly Sales! (Currency)": lead.monthly_revenue || Math.floor((appData?.annual_gross_sales || 0) / 12) || '',
        "Street": appData?.physical_address || appData?.home_address || '',
        "City": appData?.city || appData?.city_owner || '',
        "Province!": mapProvince(lead.city_province || appData?.state || appData?.state_owner || ''),
        "Country!": lead.country === 'CA' ? 'Canada' : lead.country || '',
        "Postal Code!": appData?.zip || appData?.zip_owner || '',
        "Years in Business! (Integer only)": mapTimeInBusiness(lead.time_in_business || ''),
        "Entity Type!": getEntityType(),
        "Industry!": mapIndustry(lead.use_of_funds || ''),
        "Use of Funds": lead.use_of_funds || appData?.use_of_funds || '',
        "Attached Files": collectFileUrls(),
        "File Count": countFiles().toString()
      };
    };

    // Build Make.com payload with selective field inclusion
    let payload = overridePayload

    if (!overridePayload) {
      // Build filtered lead data
      const filteredLead = filterFields(lead, leadFields)

      // Build filtered partner data
      let filteredPartner = null
      if (lead.lead_assignments?.[0]?.partners) {
        filteredPartner = filterFields(lead.lead_assignments[0].partners, partnerFields)
      }

      // Helper function to convert file paths to public URLs
      const convertFilesToUrls = (files: any[]) => {
        if (!Array.isArray(files)) return []
        return files.map(file => {
          if (typeof file === 'string') {
            return `${supabaseUrl}/storage/v1/object/public/application-documents/${file}`
          }
          if (file?.name) {
            return `${supabaseUrl}/storage/v1/object/public/application-documents/${file.name}`
          }
          return file
        })
      }

      // Build application bundle
      const applications: any = {}
      
      if (applicationFields.bundle_application && (usaApplication || canadianApplication)) {
        const bundle: any = {}
        
        if (usaApplication) {
          const usaData = { ...usaApplication }
          // Convert file attachments to public URLs
          if (usaData.document_files) {
            usaData.document_files = convertFilesToUrls(usaData.document_files)
          }
          if (usaData.processing_statements) {
            usaData.processing_statements = convertFilesToUrls(usaData.processing_statements)
          }
          bundle.usa_application = usaData
        }
        
        if (canadianApplication) {
          const canadianData = { ...canadianApplication }
          // Convert file attachments to public URLs
          if (canadianData.document_files) {
            canadianData.document_files = convertFilesToUrls(canadianData.document_files)
          }
          if (canadianData.processing_statements) {
            canadianData.processing_statements = convertFilesToUrls(canadianData.processing_statements)
          }
          bundle.canadian_application = canadianData
        }
        
        if (applicationFields.bundle_as_json) {
          applications.application_bundle = JSON.stringify(bundle, null, 2)
        } else {
          applications.application_bundle = bundle
        }
        
        applications.bundle_info = {
          has_usa_application: !!usaApplication,
          has_canadian_application: !!canadianApplication,
          format: applicationFields.bundle_as_json ? 'json_string' : 'object'
        }
      } else {
        // Legacy format for backwards compatibility
        if (applicationFields.usa_reference || applicationFields.include_attachments) {
          applications.usa = {
            exists: !!usaApplication
          }
          
          if (applicationFields.usa_reference) {
            applications.usa.reference = usaApplication?.application_reference_number || null
          }
          
          if (applicationFields.include_attachments && usaApplication) {
            applications.usa.attachments = {
              document_files: convertFilesToUrls(usaApplication.document_files || []),
              processing_statements: convertFilesToUrls(usaApplication.processing_statements || [])
            }
          }
        }
        
        if (applicationFields.canadian_reference || applicationFields.include_attachments) {
          applications.canadian = {
            exists: !!canadianApplication
          }
          
          if (applicationFields.canadian_reference) {
            applications.canadian.reference = canadianApplication?.application_reference_number || null
          }
          
          if (applicationFields.include_attachments && canadianApplication) {
            applications.canadian.attachments = {
              document_files: convertFilesToUrls(canadianApplication.document_files || []),
              processing_statements: convertFilesToUrls(canadianApplication.processing_statements || [])
            }
          }
        }
      }

      // Build filtered metadata
      const potentialMetadata = {
        triggered_by_user_id: user.id,
        triggered_by_email: user.email,
        triggered_at: new Date().toISOString()
      }
      const filteredMetadata = filterFields(potentialMetadata, metadataFields)

      // Construct final payload
      if (settings.spreadsheet_format) {
        // Use spreadsheet format transformation
        payload = transformToSpreadsheetFormat(lead, filteredPartner, usaApplication, canadianApplication);
      } else {
        // Use original JSON format
        payload = {
          event_type: eventType,
          idempotency_key: `${leadId}:${eventType}:${new Date().getTime()}`,
          lead: filteredLead,
          partner: filteredPartner,
          applications,
          metadata: filteredMetadata
        };
      }
    }

    // Get webhook URL from settings table
    const webhookUrl = settings.webhook_url;
    if (!webhookUrl) {
      return new Response(
        JSON.stringify({ error: 'Make.com webhook URL not configured. Please set it in the Make.com Integration settings.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Send to Make.com
    let httpStatus: number
    let responseData: any
    let errorMessage: string | null = null

    try {
      console.log('Sending payload to Make.com:', JSON.stringify(payload, null, 2))
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      httpStatus = response.status
      const responseText = await response.text()
      
      // Try to parse as JSON, otherwise keep as text
      try {
        responseData = JSON.parse(responseText)
      } catch {
        responseData = { 
          message: 'Non-JSON response',
          response_text: responseText.substring(0, 500), // Truncate long responses
          content_type: response.headers.get('content-type')
        }
      }

      if (!response.ok) {
        // Provide more specific error messages based on status code
        switch (response.status) {
          case 410:
            errorMessage = 'Webhook URL expired or deleted. Please update your Make.com webhook URL.'
            break
          case 404:
            errorMessage = 'Webhook URL not found. Please verify your Make.com webhook URL is correct.'
            break
          case 400:
            errorMessage = 'Bad request. The payload format may not be supported by your Make.com scenario.'
            break
          case 401:
            errorMessage = 'Unauthorized. Check if your Make.com scenario requires authentication.'
            break
          case 403:
            errorMessage = 'Forbidden. Your Make.com scenario may not accept requests from this source.'
            break
          case 500:
            errorMessage = 'Make.com server error. Please try again later or check your scenario.'
            break
          default:
            errorMessage = responseData?.message || responseData?.error || `HTTP ${response.status}: ${response.statusText}`
        }
        
        console.error(`Make.com webhook failed with status ${response.status}:`, {
          status: response.status,
          statusText: response.statusText,
          responseData,
          webhookUrl: webhookUrl.substring(0, 50) + '...' // Log partial URL for debugging
        })
      } else {
        console.log('Successfully sent to Make.com:', {
          status: response.status,
          responseData
        })
      }
    } catch (error) {
      httpStatus = 0
      errorMessage = error instanceof Error ? error.message : 'Network error'
      responseData = { error: errorMessage }
      console.error('Failed to send to Make.com:', error)
    }

    // Log the integration attempt
    const { error: logError } = await supabase
      .from('make_integration_logs')
      .insert({
        lead_id: leadId,
        event_type: eventType,
        status: errorMessage ? 'failed' : 'success',
        http_status: httpStatus,
        error_message: errorMessage,
        response_data: responseData,
        attempts: 1
      })

    if (logError) {
      console.error('Failed to log Make integration:', logError)
    }

    if (errorMessage) {
      return new Response(
        JSON.stringify({ 
          error: 'Failed to send to Make.com',
          details: errorMessage,
          http_status: httpStatus
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        http_status: httpStatus,
        response_data: responseData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Send to Make error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})