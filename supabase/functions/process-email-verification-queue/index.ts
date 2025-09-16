import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Listen for notifications from the database
    const connection = await supabase.rpc('pg_notify_listen', { channel: 'send_email_verification' });
    
    console.log('Listening for email verification notifications...');

    // Process notifications
    supabase.channel('send_email_verification')
      .on('postgres_changes', { event: '*', schema: 'public' }, async (payload) => {
        console.log('Received notification:', payload);
        
        try {
          const notificationData = JSON.parse(payload.new.payload || '{}');
          const { lead_id, email, name } = notificationData;
          
          if (lead_id && email) {
            console.log(`Processing email verification for lead ${lead_id}`);
            
            // Call the send-email-verification function
            const { data, error } = await supabase.functions.invoke('send-email-verification', {
              body: {
                leadId: lead_id,
                email: email,
                name: name || 'Valued Customer'
              }
            });

            if (error) {
              console.error('Error sending email verification:', error);
            } else {
              console.log('Email verification sent successfully:', data);
            }
          }
        } catch (parseError) {
          console.error('Error parsing notification data:', parseError);
        }
      })
      .subscribe();

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Email verification processor started' 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in process-email-verification-queue function:", error);
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