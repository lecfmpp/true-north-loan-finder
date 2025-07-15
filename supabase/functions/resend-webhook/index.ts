import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhook = await req.json();
    console.log('Received Resend webhook:', webhook);

    const { type, data } = webhook;
    
    if (!data?.email_id) {
      console.log('No email_id in webhook data');
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    // Find the email send record by resend_email_id
    const { data: emailSend, error: findError } = await supabase
      .from('email_sends')
      .select('*')
      .eq('resend_email_id', data.email_id)
      .single();

    if (findError || !emailSend) {
      console.log(`Email send record not found for email_id: ${data.email_id}`);
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    // Update based on event type
    const updates: any = {};
    
    switch (type) {
      case 'email.delivered':
        updates.delivered_at = new Date().toISOString();
        if (emailSend.status === 'sent') {
          updates.status = 'delivered';
        }
        break;
        
      case 'email.opened':
        updates.opened_at = new Date().toISOString();
        if (['sent', 'delivered'].includes(emailSend.status)) {
          updates.status = 'opened';
        }
        break;
        
      case 'email.clicked':
        updates.clicked_at = new Date().toISOString();
        updates.status = 'clicked';
        break;
        
      case 'email.bounced':
      case 'email.complaint':
        updates.status = 'failed';
        updates.error_message = `${type}: ${data.reason || 'Unknown reason'}`;
        break;
        
      default:
        console.log(`Unhandled webhook type: ${type}`);
        return new Response('OK', { status: 200, headers: corsHeaders });
    }

    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from('email_sends')
        .update(updates)
        .eq('id', emailSend.id);

      if (updateError) {
        console.error('Error updating email send:', updateError);
      } else {
        console.log(`Updated email send ${emailSend.id} for event ${type}`);
      }
    }

    return new Response('OK', { status: 200, headers: corsHeaders });

  } catch (error: any) {
    console.error('Error in resend-webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
};

serve(handler);