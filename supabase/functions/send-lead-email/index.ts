import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendLeadEmailRequest {
  leadId: string;
  recipientEmail: string;
  recipientName: string;
}

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    
    // Input validation and sanitization
    if (!requestBody || typeof requestBody !== 'object') {
      throw new Error('Invalid request body');
    }
    
    const { leadId, recipientEmail, recipientName }: SendLeadEmailRequest = requestBody;
    
    // Validate required fields
    if (!leadId || typeof leadId !== 'string' || !leadId.trim()) {
      throw new Error('Valid leadId is required');
    }
    
    // Validate email format
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!recipientEmail || !emailRegex.test(recipientEmail)) {
      throw new Error('Valid recipient email is required');
    }
    
    // Sanitize recipient name
    if (!recipientName || typeof recipientName !== 'string' || !recipientName.trim()) {
      throw new Error('Valid recipient name is required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if this is an admin notification (bypass partner verification)
    const isAdminNotification = recipientEmail === 'lecfmpp@gmail.com';
    
    if (!isAdminNotification) {
      // Check if recipient is in the partners table (for Admin panel sends)
      const { data: partner, error: partnerError } = await supabase
        .from('partners')
        .select('id, name, email, is_active')
        .eq('email', recipientEmail)
        .eq('is_active', true)
        .single();

      // If not found in partners table, check lender_broker_applications table
      if (partnerError || !partner) {
        const { data: recipient, error: recipientError } = await supabase
          .from('lender_broker_applications')
          .select('id, applicant_name, applicant_email, status')
          .eq('applicant_email', recipientEmail)
          .eq('status', 'approved')
          .single();

        if (recipientError || !recipient) {
          console.error('Recipient is not an approved partner in either table:', { partnerError, recipientError });
          return new Response(
            JSON.stringify({ 
              error: 'Recipient is not an approved partner',
              details: 'Only approved lenders and brokers can receive lead communications'
            }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log(`Email recipient verified as approved partner from applications: ${recipient.applicant_name}`);
      } else {
        console.log(`Email recipient verified as active partner: ${partner.name}`);
      }
    } else {
      console.log(`Sending admin notification to: ${recipientEmail}`);
    }

    // Fetch lead information
    const { data: lead, error: leadError } = await supabase
      .from('quiz_responses')
      .select('id, name, email, phone, loan_amount, monthly_revenue, time_in_business, credit_score, use_of_funds, website, created_at, score, company_name, country, city_province')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      console.error('Error fetching lead:', leadError);
      return new Response(
        JSON.stringify({ error: 'Lead not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for associated applications and get complete application data
    let applicationInfo = '';
    let hasApplication = false;
    let applicationDocuments = [];
    
    console.log(`Checking for applications associated with lead ID: ${leadId}`);
    
    // Check for USA application
    const { data: usaApp, error: usaError } = await supabase
      .from('usa_applications')
      .select('application_reference_number, status, created_at, document_files, legal_corporation_name, principal_name, business_type, use_of_funds, years_in_business, months_in_business')
      .eq('quiz_response_id', leadId)
      .single();
      
    if (usaError && usaError.code !== 'PGRST116') {
      console.error('Error checking USA application:', usaError);
    }
      
    // Check for Canadian application  
    const { data: canApp, error: canError } = await supabase
      .from('canadian_applications')
      .select('application_reference_number, status, created_at, document_files, legal_business_name, principal_owner_name, type_of_entity, use_of_funds, business_start_date')
      .eq('quiz_response_id', leadId)
      .single();
      
    if (canError && canError.code !== 'PGRST116') {
      console.error('Error checking Canadian application:', canError);
    }

    console.log(`USA Application found: ${!!usaApp}, Canadian Application found: ${!!canApp}`);

    if (usaApp) {
      hasApplication = true;
      applicationDocuments = Array.isArray(usaApp.document_files) ? usaApp.document_files : [];
      console.log(`USA Application documents: ${JSON.stringify(applicationDocuments)}`);
      
      const timeInBusiness = `${usaApp.years_in_business} years, ${usaApp.months_in_business} months`;
      applicationInfo = `
      <div class="info-item highlight" style="grid-column: 1 / -1;">
        <div class="info-label">📄 Complete USA Application Submitted</div>
        <div class="info-value">
          <strong>Reference:</strong> ${usaApp.application_reference_number}<br>
          <strong>Status:</strong> ${usaApp.status}<br>
          <strong>Business Name:</strong> ${usaApp.legal_corporation_name}<br>
          <strong>Principal:</strong> ${usaApp.principal_name}<br>
          <strong>Business Type:</strong> ${usaApp.business_type}<br>
          <strong>Time in Business:</strong> ${timeInBusiness}<br>
          <strong>Use of Funds:</strong> ${usaApp.use_of_funds}<br>
          <strong>Submitted:</strong> ${new Date(usaApp.created_at).toLocaleDateString()}<br>
          <strong>Documents Provided:</strong> ${applicationDocuments.length} files
        </div>
      </div>`;
    } else if (canApp) {
      hasApplication = true;
      applicationDocuments = Array.isArray(canApp.document_files) ? canApp.document_files : [];
      console.log(`Canadian Application documents: ${JSON.stringify(applicationDocuments)}`);
      
      const businessAge = canApp.business_start_date ? 
        `Since ${new Date(canApp.business_start_date).toLocaleDateString()}` : 
        'Not specified';
      applicationInfo = `
      <div class="info-item highlight" style="grid-column: 1 / -1;">
        <div class="info-label">📄 Complete Canadian Application Submitted</div>
        <div class="info-value">
          <strong>Reference:</strong> ${canApp.application_reference_number}<br>
          <strong>Status:</strong> ${canApp.status}<br>
          <strong>Business Name:</strong> ${canApp.legal_business_name}<br>
          <strong>Principal:</strong> ${canApp.principal_owner_name}<br>
          <strong>Entity Type:</strong> ${canApp.type_of_entity}<br>
          <strong>Business Started:</strong> ${businessAge}<br>
          <strong>Use of Funds:</strong> ${canApp.use_of_funds}<br>
          <strong>Submitted:</strong> ${new Date(canApp.created_at).toLocaleDateString()}<br>
          <strong>Documents Provided:</strong> ${applicationDocuments.length} files
        </div>
      </div>`;
    }

    console.log(`Final check - hasApplication: ${hasApplication}, documents count: ${applicationDocuments.length}`);

    // Helper function to get credit score number and description from classification
    const getCreditScoreDescription = (creditScore: string) => {
      switch (creditScore) {
        case "excellent": return { range: "750+", description: "Excellent credit - qualifies for best rates and terms" };
        case "good": return { range: "700-749", description: "Good credit - qualifies for competitive rates" };
        case "fair": return { range: "650-699", description: "Fair credit - may need specialized lenders" };
        case "poor": return { range: "Below 650", description: "Poor credit - alternative financing options available" };
        case "unsure": return { range: "Unknown", description: "Credit score to be verified during application process" };
        default: return { range: creditScore, description: "Credit score provided" };
      }
    };

    // Helper function to get time in business description
    const getTimeInBusinessDescription = (timeInBusiness: string) => {
      switch (timeInBusiness) {
        case "startup": return "Startup business (less than 6 months)";
        case "6-12": return "New business (6-12 months in operation)";
        case "1-2": return "Growing business (1-2 years in operation)";
        case "2-5": return "Established business (2-5 years in operation)";
        case "5+": return "Mature business (5+ years in operation)";
        default: return timeInBusiness;
      }
    };

    // Helper function to get use of funds description
    const getUseOfFundsDescription = (useOfFunds: string) => {
      switch (useOfFunds) {
        case "equipment": return "Equipment & Machinery Purchase";
        case "inventory": return "Inventory & Stock Investment";
        case "expansion": return "Business Expansion & Growth";
        case "working-capital": return "Working Capital & Cash Flow";
        case "real-estate": return "Real Estate & Property Investment";
        case "other": return "Other Business Purposes";
        default: return useOfFunds;
      }
    };

    // Format the amount and revenue for display
    const formatAmount = (amount: number) => {
      return new Intl.NumberFormat('en-CA', {
        style: 'currency',
        currency: 'CAD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    };

    const formatPhone = (phone: string) => {
      // Simple phone formatting for Canadian numbers
      const cleaned = phone.replace(/\D/g, '');
      if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
      }
      return phone;
    };

    // Create the email HTML template
    const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Qualified Lead - ${lead.name}</title>
        <style>
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                line-height: 1.6; 
                margin: 0; 
                padding: 0; 
                background-color: #f8fafc; 
            }
            .container { 
                max-width: 600px; 
                margin: 20px auto; 
                background: #ffffff; 
                border-radius: 8px; 
                overflow: hidden; 
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); 
            }
            .header { 
                background: #1e3a8a; 
                color: #ffffff; 
                padding: 40px 30px; 
                text-align: center; 
            }
            .logo { 
                width: 150px; 
                height: auto; 
                margin-bottom: 20px; 
                display: block; 
                margin-left: auto; 
                margin-right: auto;
            }
            .header h1 { 
                margin: 0; 
                font-size: 28px; 
                font-weight: 600; 
                color: #ffffff; 
            }
            .header p { 
                margin: 10px 0 0 0; 
                font-size: 16px; 
                color: #ffffff; 
                opacity: 0.9; 
            }
            .content { 
                padding: 30px; 
                background: #ffffff; 
            }
            .urgency { 
                background: #ffffff; 
                border: 2px solid #10b981; 
                padding: 20px; 
                border-radius: 8px; 
                margin: 20px 0; 
                text-align: center;
            }
            .urgency strong { 
                color: #1e3a8a; 
                font-size: 18px;
            }
            .urgency p {
                color: #1e3a8a;
                margin: 8px 0 0 0;
            }
            .lead-card { 
                background: #ffffff; 
                border: 2px solid #1e3a8a; 
                padding: 25px; 
                margin: 25px 0; 
                border-radius: 8px; 
            }
            .lead-card h2 {
                margin: 0 0 15px 0; 
                color: #1e3a8a; 
                font-size: 20px;
            }
            .lead-card h3 { 
                margin: 0; 
                color: #1e3a8a; 
                font-size: 24px; 
                font-weight: 600;
            }
            .lead-card p { 
                margin: 5px 0 0 0; 
                color: #1e3a8a; 
                font-size: 16px; 
            }
            .lead-info { 
                display: grid; 
                grid-template-columns: 1fr 1fr; 
                gap: 15px; 
                margin: 25px 0; 
            }
            .info-item { 
                background: #ffffff; 
                padding: 20px; 
                border-radius: 8px; 
                border: 1px solid #e5e7eb; 
            }
            .info-label { 
                font-size: 12px; 
                color: #1e3a8a; 
                text-transform: uppercase; 
                font-weight: 600; 
                margin-bottom: 8px; 
            }
            .info-value { 
                font-size: 16px; 
                color: #1e3a8a; 
                font-weight: 500; 
            }
            .highlight { 
                background: #ffffff; 
                border: 2px solid #10b981; 
            }
            .highlight .info-value { 
                color: #1e3a8a; 
                font-weight: 600; 
                font-size: 18px;
            }
            .cta-section { 
                background: #1e3a8a; 
                color: #ffffff; 
                padding: 30px; 
                margin: 30px 0; 
                border-radius: 8px; 
                text-align: center; 
            }
            .cta-section h2 {
                margin: 0 0 15px 0;
                color: #ffffff;
                font-size: 24px;
            }
            .cta-section p {
                margin: 0 0 25px 0;
                color: #ffffff;
                font-size: 16px;
            }
            .cta-button { 
                display: inline-block; 
                background: #10b981; 
                color: #ffffff; 
                padding: 15px 35px; 
                border-radius: 8px; 
                text-decoration: none; 
                font-weight: 600; 
                font-size: 16px;
                margin: 10px; 
            }
            .next-steps {
                background: #ffffff;
                border: 1px solid #e5e7eb;
                padding: 25px;
                border-radius: 8px;
                margin: 25px 0;
            }
            .next-steps h3 {
                margin: 0 0 15px 0;
                color: #1e3a8a;
                font-size: 18px;
            }
            .next-steps ol {
                margin: 0;
                padding-left: 20px;
                color: #1e3a8a;
            }
            .next-steps li {
                margin-bottom: 8px;
                color: #1e3a8a;
            }
            .next-steps strong {
                color: #1e3a8a;
            }
            .footer { 
                background: #f8fafc; 
                padding: 25px; 
                text-align: center; 
                color: #1e3a8a; 
                font-size: 14px; 
                border-top: 1px solid #e5e7eb;
            }
            .footer p {
                margin: 5px 0;
                color: #1e3a8a;
            }
            .footer strong {
                color: #1e3a8a;
            }
            .website-link {
                color: #10b981;
                text-decoration: none;
                font-weight: 500;
            }
            .created-date {
                color: #1e3a8a;
                font-style: italic;
                text-align: center;
                margin-top: 25px;
                font-size: 14px;
            }
            @media (max-width: 600px) {
                .lead-info { grid-template-columns: 1fr; }
                .container { margin: 10px; }
                .header, .content { padding: 20px; }
                .logo { width: 120px; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <svg class="logo" viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg">
                    <rect width="200" height="60" fill="#ffffff" rx="4"/>
                    <text x="100" y="25" font-family="Arial, sans-serif" font-size="14" font-weight="bold" text-anchor="middle" fill="#1e3a8a">TRUE NORTH</text>
                    <text x="100" y="42" font-family="Arial, sans-serif" font-size="12" text-anchor="middle" fill="#10b981">BUSINESS LOAN</text>
                </svg>
                <h1>🚀 New Qualified Lead!</h1>
                <p>We found the perfect business looking for funding</p>
            </div>
            
            <div class="content">
                <div class="urgency">
                    <strong>⏰ Time Sensitive Opportunity</strong>
                    <p>This lead is ready to sign papers and move forward immediately. They've completed our qualification process and are actively seeking funding.</p>
                </div>

                <div class="lead-card">
                    <h2>Lead Information</h2>
                    <h3>${lead.name}</h3>
                    <p>${lead.email}</p>
                </div>

                <div class="lead-info">
                    <div class="info-item highlight">
                        <div class="info-label">💰 Funding Amount Requested</div>
                        <div class="info-value">${formatAmount(lead.loan_amount)}</div>
                    </div>
                    <div class="info-item highlight">
                        <div class="info-label">📊 Monthly Business Revenue</div>
                        <div class="info-value">${formatAmount(lead.monthly_revenue)}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">📞 Direct Phone Number</div>
                        <div class="info-value">${formatPhone(lead.phone)}</div>
                    </div>
                    ${lead.company_name ? `
                    <div class="info-item">
                        <div class="info-label">🏢 Company Name</div>
                        <div class="info-value"><strong>${lead.company_name}</strong></div>
                    </div>` : ''}
                    ${lead.country && lead.city_province ? `
                    <div class="info-item">
                        <div class="info-label">📍 Business Location</div>
                        <div class="info-value">${lead.city_province}, ${lead.country}</div>
                    </div>` : ''}
                    <div class="info-item">
                        <div class="info-label">⏱️ Time in Business</div>
                        <div class="info-value">${getTimeInBusinessDescription(lead.time_in_business)}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">💳 Credit Score</div>
                        <div class="info-value">${getCreditScoreDescription(lead.credit_score).range} - ${getCreditScoreDescription(lead.credit_score).description}</div>
                    </div>
                    <div class="info-item highlight">
                        <div class="info-label">⭐ Qualification Score</div>
                        <div class="info-value">${lead.score}/100 (${lead.score >= 85 ? "Excellent - Prime candidate for competitive rates" : lead.score >= 70 ? "Great - Strong qualification profile" : lead.score >= 55 ? "Good - Solid financing candidate" : "Fair - Alternative financing options available"})</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">🎯 Intended Use of Funds</div>
                        <div class="info-value">${getUseOfFundsDescription(lead.use_of_funds)}</div>
                    </div>
                    ${applicationInfo}
                    ${hasApplication && applicationDocuments.length > 0 ? `
                    <div class="info-item highlight" style="grid-column: 1 / -1;">
                        <div class="info-label">📎 Application Documents Available</div>
                        <div class="info-value">
                          Complete application with ${applicationDocuments.length} supporting documents has been submitted. 
                          Contact immediately as applicant expects same-day response with funding options.
                        </div>
                    </div>` : ''}
                </div>

                ${lead.website ? `
                <div class="info-item" style="margin: 20px 0;">
                    <div class="info-label">🌐 Website</div>
                    <div class="info-value"><a href="${lead.website}" target="_blank" class="website-link">${lead.website}</a></div>
                </div>
                ` : ''}

                <div class="cta-section">
                    <h2>📞 Ready to Close This Deal?</h2>
                    <p>This lead is qualified and ready to move forward. Call them now to secure this opportunity!</p>
                    <a href="tel:${lead.phone}" class="cta-button">📱 Call Lead Now</a>
                </div>

                <div class="next-steps">
                    <h3>📋 Next Steps:</h3>
                    <ol>
                        <li><strong>Call immediately</strong> - Strike while the iron is hot</li>
                        <li><strong>Confirm funding needs</strong> - Verify the ${formatAmount(lead.loan_amount)} requirement</li>
                        <li><strong>Review qualifications</strong> - They've already been pre-screened</li>
                        <li><strong>Present your offer</strong> - They're ready to hear solutions</li>
                        <li><strong>Close the deal</strong> - Move quickly to secure this opportunity</li>
                    </ol>
                </div>

                <p class="created-date">
                    This lead was generated on ${new Date(lead.created_at).toLocaleDateString('en-CA', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })} and is actively seeking funding solutions.
                </p>
            </div>

            <div class="footer">
                <p>This lead was sent to you because you're an approved partner in our network.</p>
                <p><strong>True North Business Loan</strong> - Connecting Canadian businesses with the right lenders.</p>
            </div>
        </div>
    </body>
    </html>
    `;

    // Prepare attachments if there are application documents
    let attachments = [];
    
    if (hasApplication && applicationDocuments.length > 0) {
      console.log(`Processing ${applicationDocuments.length} documents for attachment`);
      
      for (const filePath of applicationDocuments) {
        try {
          // Download the file from Supabase storage
          const { data: fileData, error: fileError } = await supabase.storage
            .from('application-documents')
            .download(filePath);

          if (fileError) {
            console.error(`Error downloading file ${filePath}:`, fileError);
            continue; // Skip this file and continue with others
          }

          if (fileData) {
            // Convert file to base64 - handle large files efficiently
            const arrayBuffer = await fileData.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            
            // Convert to base64 in chunks to avoid "Maximum call stack size exceeded"
            let base64 = '';
            const chunkSize = 8192; // Process in 8KB chunks
            
            for (let i = 0; i < uint8Array.length; i += chunkSize) {
              const chunk = uint8Array.slice(i, i + chunkSize);
              base64 += btoa(String.fromCharCode.apply(null, Array.from(chunk)));
            }
            
            // Extract filename from path
            const fileName = filePath.split('/').pop() || 'document';
            
            // Get file extension to determine content type
            const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
            let contentType = 'application/octet-stream';
            
            switch (fileExtension) {
              case 'pdf':
                contentType = 'application/pdf';
                break;
              case 'jpg':
              case 'jpeg':
                contentType = 'image/jpeg';
                break;
              case 'png':
                contentType = 'image/png';
                break;
              case 'gif':
                contentType = 'image/gif';
                break;
              case 'doc':
                contentType = 'application/msword';
                break;
              case 'docx':
                contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                break;
              case 'txt':
                contentType = 'text/plain';
                break;
            }

            attachments.push({
              filename: fileName.replace(/^\d+-/, ''), // Remove timestamp prefix if present
              content: base64,
              content_type: contentType
            });
            
            console.log(`Successfully prepared attachment: ${fileName}`);
          }
        } catch (attachError) {
          console.error(`Error processing attachment ${filePath}:`, attachError);
          continue; // Skip this file and continue with others
        }
      }
      
      console.log(`Prepared ${attachments.length} attachments for email`);
    }

    // Send the email (using verified domain) with optional attachments
    const emailPayload: any = {
      from: "True North Business Loan <leads@email.truenorthbusinessloan.ca>",
      to: [recipientEmail],
      subject: `🚀 New Qualified Lead: ${lead.name} - ${formatAmount(lead.loan_amount)} Funding Request${hasApplication ? ' (Complete Application Attached)' : ''}`,
      html: emailHtml,
    };

    // Add attachments if any exist
    if (attachments.length > 0) {
      emailPayload.attachments = attachments;
    }

    const emailResponse = await resend.emails.send(emailPayload);

    console.log("Lead email sent successfully:", emailResponse);

    // Record the custom email send in the database
    try {
      const { error: insertError } = await supabase
        .from('lead_custom_emails')
        .insert({
          lead_id: leadId,
          recipient_emails: [recipientEmail],
          sent_by: null, // Set to null for system-generated emails since it expects a UUID
          sent_at: new Date().toISOString()
        });

      if (insertError) {
        console.error("Error recording custom email:", insertError);
      } else {
        console.log("Custom email recorded successfully");
      }
    } catch (recordError) {
      console.error("Error recording custom email:", recordError);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      emailId: emailResponse.data?.id,
      leadName: lead.name,
      recipientName 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in send-lead-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);