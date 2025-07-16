import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AutoEnrollRequest {
  email: string;
  name: string;
  sequenceType: 'follow_up' | 'pre_call_reminder';
  userData?: any;
}

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const resendApiKey = Deno.env.get("RESEND_API_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const resend = new Resend(resendApiKey);

const SUPERADMIN_EMAIL = "lecfmpp@gmail.com";

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, sequenceType, userData }: AutoEnrollRequest = await req.json();

    console.log(`Auto-enrolling ${email} in ${sequenceType} sequence`);

    // Get the sequence
    const { data: sequence, error: sequenceError } = await supabase
      .from('email_sequences')
      .select('id')
      .eq('sequence_type', sequenceType)
      .eq('is_active', true)
      .single();

    if (sequenceError || !sequence) {
      console.log(`No active sequence found for type: ${sequenceType}`);
      return new Response(JSON.stringify({ 
        success: false, 
        message: `No active sequence found for type: ${sequenceType}` 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if user is already enrolled in this sequence
    const { data: existingEnrollment } = await supabase
      .from('email_enrollments')
      .select('id')
      .eq('user_email', email)
      .eq('sequence_id', sequence.id)
      .single();

    if (existingEnrollment) {
      console.log(`User ${email} already enrolled in ${sequenceType} sequence`);
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'User already enrolled',
        enrollmentId: existingEnrollment.id
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create enrollment
    const enrollmentData = {
      sequence_id: sequence.id,
      user_email: email,
      user_name: name,
      status: 'active',
      enrollment_data: userData || {}
    };

    const { data: enrollment, error: enrollmentError } = await supabase
      .from('email_enrollments')
      .insert(enrollmentData)
      .select()
      .single();

    if (enrollmentError) throw enrollmentError;

    console.log(`Successfully enrolled ${email} in ${sequenceType} sequence`);

    // Send notification to superadmin for new leads using existing email template system
    if (sequenceType === 'follow_up' && userData) {
      try {
        console.log(`Sending lead notification to superadmin for ${email}`);
        
        // Use existing email sequence system to send admin notification
        const adminNotificationResponse = await supabase.functions.invoke('send-email-sequence', {
          body: {
            type: 'admin_notification',
            userEmail: SUPERADMIN_EMAIL,
            userName: 'Admin',
            templateId: '869d296d-531c-42e1-89ac-b98e4636e6ed', // Admin notification template
            variables: {
              user_name: name,
              user_email: email,
              user_phone: userData.phone || 'Not provided',
              loan_amount: userData.loan_amount?.toLocaleString() || 'Not specified',
              monthly_revenue: userData.monthly_revenue?.toLocaleString() || 'Not specified',
              credit_score: userData.credit_score || 'Not provided',
              time_in_business: userData.time_in_business || 'Not provided',
              use_of_funds: userData.use_of_funds || 'Not specified',
              website: userData.website || 'Not provided',
              score: userData.score || 'Not calculated'
            }
          }
        });

        if (adminNotificationResponse.error) {
          console.error('Error sending admin notification via email sequence:', adminNotificationResponse.error);
        } else {
          console.log(`Lead notification sent to superadmin successfully`);
        }
      } catch (notificationError) {
        console.error('Error sending superadmin notification:', notificationError);
        // Don't fail the main function if notification fails
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Successfully enrolled in sequence',
      enrollmentId: enrollment.id
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error("Error in auto-enroll-lead function:", error);
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