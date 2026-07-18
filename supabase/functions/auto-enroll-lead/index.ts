import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    // Trigger the email sequence to start sending emails
    try {
      console.log(`Starting email sequence for ${email}`);
      const emailSequenceResponse = await supabase.functions.invoke('send-email-sequence', {
        body: {
          email: email,
          name: name,
          sequenceType: sequenceType,
          variables: userData || {}
        }
      });

      if (emailSequenceResponse.error) {
        console.error('Error starting email sequence:', emailSequenceResponse.error);
      } else {
        console.log(`Email sequence started successfully for ${email}`);
      }
    } catch (emailError) {
      console.error('Error triggering email sequence:', emailError);
      // Don't fail the main function if email sequence fails
    }

    // Note: Admin notifications are now handled manually through the Admin panel
    // to give better control over lead distribution

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