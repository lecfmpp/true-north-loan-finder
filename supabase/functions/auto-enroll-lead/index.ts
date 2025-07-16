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

    // Send notification to superadmin for new leads (not for reminder sequences)
    if (sequenceType === 'follow_up' && userData) {
      try {
        console.log(`Sending lead notification to superadmin for ${email}`);
        
        const emailBody = `
          <h2>🎯 New Lead Submission - True North Business Loan</h2>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Lead Information:</h3>
            <ul style="list-style: none; padding: 0;">
              <li><strong>Name:</strong> ${name}</li>
              <li><strong>Email:</strong> ${email}</li>
              <li><strong>Phone:</strong> ${userData.phone || 'Not provided'}</li>
              <li><strong>Loan Amount:</strong> $${userData.loan_amount?.toLocaleString() || 'Not specified'}</li>
              <li><strong>Monthly Revenue:</strong> $${userData.monthly_revenue?.toLocaleString() || 'Not specified'}</li>
              <li><strong>Credit Score:</strong> ${userData.credit_score || 'Not provided'}</li>
              <li><strong>Time in Business:</strong> ${userData.time_in_business || 'Not provided'}</li>
              <li><strong>Use of Funds:</strong> ${userData.use_of_funds || 'Not specified'}</li>
              <li><strong>Website:</strong> ${userData.website || 'Not provided'}</li>
              <li><strong>Score:</strong> ${userData.score || 'Not calculated'}/100</li>
            </ul>
          </div>
          
          <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Next Steps:</strong></p>
            <ul>
              <li>Lead has been automatically enrolled in the follow-up email sequence</li>
              <li>You can view and manage this lead in the admin dashboard</li>
              <li>Consider reaching out for a personal follow-up if this is a high-quality lead</li>
            </ul>
          </div>
          
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            This notification was sent automatically when a new lead completed the loan estimator wizard.
          </p>
        `;

        await resend.emails.send({
          from: "True North Business Loan <notifications@noboringfunnels.com>",
          to: [SUPERADMIN_EMAIL],
          subject: `🎯 New Lead: ${name} - $${userData.loan_amount?.toLocaleString() || 'Amount TBD'}`,
          html: emailBody,
        });

        console.log(`Lead notification sent to superadmin successfully`);
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