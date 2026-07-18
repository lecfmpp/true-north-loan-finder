import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidationRequest {
  email?: string;
  phone?: string;
  leadData?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, phone, leadData }: ValidationRequest = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const validationResults = {
      email: null as any,
      phone: null as any,
      duplicates: null as any,
      overall: { valid: true, errors: [] as string[] }
    };

    // Email validation
    if (email) {
      console.log(`Validating email: ${email}`);
      
      // Basic email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValidFormat = emailRegex.test(email);
      
      // Check for disposable email domains (simplified list)
      const disposableDomains = [
        '10minutemail.com', 'tempmail.org', 'guerrillamail.com', 
        'mailinator.com', 'yopmail.com', 'temp-mail.org'
      ];
      const domain = email.split('@')[1]?.toLowerCase();
      const isDisposable = disposableDomains.includes(domain);

      validationResults.email = {
        email,
        valid: isValidFormat && !isDisposable,
        format_valid: isValidFormat,
        is_disposable: isDisposable,
        domain
      };

      if (!isValidFormat) {
        validationResults.overall.errors.push('Invalid email format');
        validationResults.overall.valid = false;
      }

      if (isDisposable) {
        validationResults.overall.errors.push('Disposable email not allowed');
        validationResults.overall.valid = false;
      }
    }

    // Phone validation using third-party API (mock implementation)
    if (phone) {
      console.log(`Validating phone: ${phone}`);
      
      // Clean phone number
      const cleanPhone = phone.replace(/\D/g, '');
      
      // Basic validation - must be 10-15 digits
      const isValidLength = cleanPhone.length >= 10 && cleanPhone.length <= 15;
      
      // Mock phone validation result (in production, use Bandwidth, Twilio, etc.)
      const phoneValidation = await validatePhoneNumber(cleanPhone);

      validationResults.phone = {
        phone,
        clean_phone: cleanPhone,
        valid: isValidLength && phoneValidation.valid,
        length_valid: isValidLength,
        carrier: phoneValidation.carrier,
        line_type: phoneValidation.line_type,
        is_active: phoneValidation.is_active
      };

      if (!isValidLength || !phoneValidation.valid) {
        validationResults.overall.errors.push('Invalid or inactive phone number');
        validationResults.overall.valid = false;
      }
    }

    // Duplicate checking
    if (leadData || email || phone) {
      console.log('Checking for duplicates...');
      
      const duplicateChecks = [];
      
      if (email) {
        const { data: emailDupes } = await supabase
          .from('quiz_responses')
          .select('id, created_at, name')
          .eq('email', email)
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24 hours
        
        duplicateChecks.push({
          type: 'email',
          duplicates: emailDupes?.length || 0,
          recent_leads: emailDupes || []
        });
      }

      if (phone) {
        const cleanPhone = phone.replace(/\D/g, '');
        const { data: phoneDupes } = await supabase
          .from('quiz_responses')
          .select('id, created_at, name')
          .eq('phone', cleanPhone)
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
        
        duplicateChecks.push({
          type: 'phone',
          duplicates: phoneDupes?.length || 0,
          recent_leads: phoneDupes || []
        });
      }

      const totalDuplicates = duplicateChecks.reduce((sum, check) => sum + check.duplicates, 0);
      
      validationResults.duplicates = {
        total_duplicates: totalDuplicates,
        checks: duplicateChecks,
        is_duplicate: totalDuplicates > 0
      };

      if (totalDuplicates > 0) {
        validationResults.overall.errors.push(`${totalDuplicates} duplicate(s) found in last 24 hours`);
        validationResults.overall.valid = false;
      }
    }

    console.log('Validation completed:', validationResults);

    return new Response(JSON.stringify(validationResults), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Validation error:', error);
    return new Response(JSON.stringify({ 
      error: 'Validation failed', 
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function validatePhoneNumber(phone: string): Promise<{
  valid: boolean;
  carrier?: string;
  line_type?: string;
  is_active?: boolean;
}> {
  // Mock implementation - in production, integrate with:
  // - Bandwidth Phone Number API
  // - Twilio Lookup API
  // - NumVerify API
  // - etc.
  
  try {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Mock validation logic
    const isValidLength = phone.length >= 10 && phone.length <= 15;
    const startsWithValid = phone.startsWith('1') || phone.length === 10;
    
    // Mock some invalid patterns
    const invalidPatterns = [
      /^1234567890$/, // Sequential
      /^(\d)\1{9,}$/,  // All same digit
      /^555555/        // Known fake prefix
    ];
    
    const isValidPattern = !invalidPatterns.some(pattern => pattern.test(phone));
    
    return {
      valid: isValidLength && startsWithValid && isValidPattern,
      carrier: 'Verizon', // Mock carrier
      line_type: 'mobile',
      is_active: isValidPattern
    };
    
  } catch (error) {
    console.error('Phone validation API error:', error);
    return {
      valid: false,
      carrier: 'unknown',
      line_type: 'unknown',
      is_active: false
    };
  }
}