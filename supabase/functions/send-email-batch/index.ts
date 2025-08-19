
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailBatchRequest {
  template_id?: string;
  subject?: string;
  header_logo_url?: string;
  body_blocks?: Array<{type: string; html: string}>;
  footer_html?: string;
  audience_type: 'leads' | 'partners';
  mode: 'test' | 'batch';
  test_email?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resend = new Resend(Deno.env.get('RESEND_API_KEY')!);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from JWT
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Invalid token');
    }

    // Check if user is superadmin
    const { data: isSuperadmin } = await supabase.rpc('is_superadmin', { 
      user_id_param: user.id 
    });

    if (!isSuperadmin) {
      throw new Error('Unauthorized: Superadmin required');
    }

    const requestBody: EmailBatchRequest = await req.json();
    
    let templateData: any = {};
    
    // Get template data if template_id provided
    if (requestBody.template_id) {
      const { data: template, error } = await supabase
        .from('email_sender_templates')
        .select('*')
        .eq('id', requestBody.template_id)
        .single();
        
      if (error) throw new Error(`Template not found: ${error.message}`);
      templateData = template;
    } else {
      // Use inline template data
      templateData = {
        subject: requestBody.subject,
        header_logo_url: requestBody.header_logo_url,
        body_blocks: requestBody.body_blocks || [],
        footer_html: requestBody.footer_html
      };
    }

    // Build HTML content
    const logoHtml = templateData.header_logo_url 
      ? `<img src="${templateData.header_logo_url}" alt="Logo" style="max-width: 200px; height: auto; margin: 0 auto 20px; display: block;">` 
      : '';
      
    const bodyHtml = (templateData.body_blocks || [])
      .map((block: any) => block.html || '')
      .join('\n');
      
    const footerHtml = templateData.footer_html || '';
    
    const finalHtml = `
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; border-bottom: 1px solid #eee; padding-bottom: 20px; margin-bottom: 30px;">
            ${logoHtml}
          </div>
          <div style="margin-bottom: 30px;">
            ${bodyHtml}
          </div>
          <div style="border-top: 1px solid #eee; padding-top: 20px; font-size: 12px; color: #666;">
            ${footerHtml}
          </div>
        </body>
      </html>
    `;

    if (requestBody.mode === 'test') {
      // Send test email
      if (!requestBody.test_email) {
        throw new Error('Test email required for test mode');
      }

      const { data: emailResult, error: emailError } = await resend.emails.send({
        from: 'True North <onboarding@resend.dev>',
        to: [requestBody.test_email],
        subject: `[TEST] ${templateData.subject}`,
        html: finalHtml,
      });

      if (emailError) throw emailError;

      return new Response(JSON.stringify({ 
        success: true, 
        mode: 'test',
        message: 'Test email sent successfully',
        email_id: emailResult?.id
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Batch mode - get audience
    let recipients: Array<{email: string, name: string, id: string}> = [];
    
    if (requestBody.audience_type === 'leads') {
      const { data: leads, error } = await supabase
        .from('quiz_responses')
        .select('id, email, name')
        .not('email', 'is', null)
        .neq('email', '');
        
      if (error) throw error;
      recipients = leads?.map(lead => ({
        email: lead.email,
        name: lead.name || 'Lead',
        id: lead.id
      })) || [];
    } else {
      const { data: partners, error } = await supabase
        .from('partners')
        .select('id, email, name')
        .not('email', 'is', null)
        .neq('email', '');
        
      if (error) throw error;
      recipients = partners?.map(partner => ({
        email: partner.email,
        name: partner.name || 'Partner',
        id: partner.id
      })) || [];
    }

    // Create send record
    const { data: sendRecord, error: sendError } = await supabase
      .from('email_sender_sends')
      .insert({
        template_id: requestBody.template_id || null,
        audience_type: requestBody.audience_type,
        subject: templateData.subject,
        html_content: finalHtml,
        total_recipients: recipients.length,
        status: 'sending',
        created_by: user.id
      })
      .select()
      .single();

    if (sendError) throw sendError;

    // Send emails and track recipients
    let sentCount = 0;
    let failedCount = 0;

    for (const recipient of recipients) {
      try {
        const { data: emailResult, error: emailError } = await resend.emails.send({
          from: 'True North <onboarding@resend.dev>',
          to: [recipient.email],
          subject: templateData.subject,
          html: finalHtml,
        });

        await supabase.from('email_sender_recipients').insert({
          send_id: sendRecord.id,
          recipient_email: recipient.email,
          recipient_name: recipient.name,
          lead_id: requestBody.audience_type === 'leads' ? recipient.id : null,
          partner_id: requestBody.audience_type === 'partners' ? recipient.id : null,
          resend_email_id: emailResult?.id,
          delivery_status: 'sent'
        });

        sentCount++;
      } catch (error) {
        await supabase.from('email_sender_recipients').insert({
          send_id: sendRecord.id,
          recipient_email: recipient.email,
          recipient_name: recipient.name,
          lead_id: requestBody.audience_type === 'leads' ? recipient.id : null,
          partner_id: requestBody.audience_type === 'partners' ? recipient.id : null,
          delivery_status: 'failed',
          error_message: error.message
        });

        failedCount++;
      }
    }

    // Update send status
    await supabase
      .from('email_sender_sends')
      .update({ 
        status: failedCount === 0 ? 'sent' : sentCount > 0 ? 'partial' : 'failed'
      })
      .eq('id', sendRecord.id);

    return new Response(JSON.stringify({ 
      success: true,
      mode: 'batch',
      send_id: sendRecord.id,
      total_recipients: recipients.length,
      sent_count: sentCount,
      failed_count: failedCount,
      message: `Batch send completed: ${sentCount} sent, ${failedCount} failed`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error: any) {
    console.error('Error in send-email-batch:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
};

serve(handler);
