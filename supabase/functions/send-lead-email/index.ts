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

    // Check if this is an admin notification or custom email (bypass partner verification)
    const isAdminNotification = recipientEmail === 'lecfmpp@gmail.com';
    const isCustomEmail = recipientName === recipientEmail.split('@')[0]; // Custom emails use email prefix as name
    
    if (!isAdminNotification && !isCustomEmail) {
      // Only verify partner status for approved partner recipients
      const { data: recipient, error: recipientError } = await supabase
        .from('lender_broker_applications')
        .select('id, applicant_name, applicant_email, status')
        .eq('applicant_email', recipientEmail)
        .eq('status', 'approved')
        .single();

      if (recipientError || !recipient) {
        console.error('Recipient is not an approved partner:', recipientError);
        return new Response(
          JSON.stringify({ 
            error: 'Recipient is not an approved partner',
            details: 'Only approved lenders and brokers can receive lead communications'
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Email recipient verified as approved partner: ${recipient.applicant_name}`);
    } else if (isCustomEmail) {
      console.log(`Sending custom lead email to: ${recipientEmail}`);
    } else {
      console.log(`Sending admin notification to: ${recipientEmail}`);
    }

    // Fetch lead information
    const { data: lead, error: leadError } = await supabase
      .from('quiz_responses')
      .select('id, name, email, phone, loan_amount, monthly_revenue, time_in_business, credit_score, use_of_funds, website, created_at')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      console.error('Error fetching lead:', leadError);
      return new Response(
        JSON.stringify({ error: 'Lead not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; position: relative; }
            .logo { width: 120px; height: auto; margin-bottom: 15px; }
            .header h1 { margin: 0; font-size: 28px; font-weight: 600; color: #ffffff; }
            .header p { margin: 10px 0 0 0; font-size: 16px; opacity: 0.9; }
            .content { padding: 30px; }
            .lead-card { background: linear-gradient(135deg, #f8faff 0%, #e0edff 100%); border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
            .lead-info { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
            .info-item { background: white; padding: 15px; border-radius: 8px; border: 1px solid #e1e5e9; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
            .info-label { font-size: 12px; color: #666; text-transform: uppercase; font-weight: 600; margin-bottom: 5px; }
            .info-value { font-size: 16px; color: #333; font-weight: 500; }
            .highlight { background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-color: #10b981; }
            .highlight .info-value { color: #059669; font-weight: 600; }
            .cta-section { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 25px; margin: 25px 0; border-radius: 10px; text-align: center; }
            .cta-button { display: inline-block; background: #10b981; color: white; padding: 15px 35px; border-radius: 25px; text-decoration: none; font-weight: 600; margin: 10px; transition: all 0.2s; box-shadow: 0 4px 10px rgba(16, 185, 129, 0.3); }
            .cta-button:hover { transform: translateY(-2px); box-shadow: 0 6px 15px rgba(16, 185, 129, 0.4); }
            .urgency { background: linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%); border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .urgency strong { color: #d97706; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
            .brand-colors { color: #1e3a8a; }
            .accent-text { color: #3b82f6; }
            @media (max-width: 600px) {
                .lead-info { grid-template-columns: 1fr; }
                .container { margin: 10px; }
                .header, .content { padding: 20px; }
                .logo { width: 100px; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="https://i.imgur.com/YourLogoHere.png" alt="True North Business Loan" class="logo" />
                <h1>🚀 New Qualified Lead!</h1>
                <p>We found the perfect business looking for funding</p>
            </div>
            
            <div class="content">
                <div class="urgency">
                    <strong>⏰ Time Sensitive:</strong> This lead is ready to sign papers and move forward immediately. 
                    They've completed our qualification process and are actively seeking funding.
                </div>

                <div class="lead-card">
                    <h2 style="margin: 0 0 15px 0; color: #333;">Lead Information</h2>
                    <h3 style="margin: 0; color: #667eea; font-size: 24px;">${lead.name}</h3>
                    <p style="margin: 5px 0 0 0; color: #666; font-size: 16px;">${lead.email}</p>
                </div>

                <div class="lead-info">
                    <div class="info-item highlight">
                        <div class="info-label">💰 Funding Amount</div>
                        <div class="info-value">${formatAmount(lead.loan_amount)}</div>
                    </div>
                    <div class="info-item highlight">
                        <div class="info-label">📊 Monthly Revenue</div>
                        <div class="info-value">${formatAmount(lead.monthly_revenue)}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">📞 Phone Number</div>
                        <div class="info-value">${formatPhone(lead.phone)}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">⏱️ Time in Business</div>
                        <div class="info-value">${lead.time_in_business}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">💳 Credit Score</div>
                        <div class="info-value">${lead.credit_score}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">🎯 Use of Funds</div>
                        <div class="info-value">${lead.use_of_funds}</div>
                    </div>
                </div>

                ${lead.website ? `
                <div class="info-item" style="margin: 15px 0;">
                    <div class="info-label">🌐 Website</div>
                    <div class="info-value"><a href="${lead.website}" target="_blank" style="color: #667eea;">${lead.website}</a></div>
                </div>
                ` : ''}

                <div class="cta-section">
                    <h2 style="margin: 0 0 15px 0;">📞 Ready to Close This Deal?</h2>
                    <p style="margin: 0 0 20px 0; opacity: 0.9;">This lead is qualified and ready to move forward. Call them ASAP to secure this opportunity!</p>
                    <a href="tel:${lead.phone}" class="cta-button">📱 Call Now</a>
                </div>

                <div style="background: #f8f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin: 0 0 10px 0; color: #333;">📋 Next Steps:</h3>
                    <ol style="margin: 0; padding-left: 20px; color: #666;">
                        <li><strong>Call immediately</strong> - Strike while the iron is hot</li>
                        <li><strong>Confirm funding needs</strong> - Verify the ${formatAmount(lead.loan_amount)} requirement</li>
                        <li><strong>Review qualifications</strong> - They've already been pre-screened</li>
                        <li><strong>Present your offer</strong> - They're ready to hear solutions</li>
                        <li><strong>Close the deal</strong> - Move quickly to secure this opportunity</li>
                    </ol>
                </div>

                <p style="color: #666; font-style: italic; text-align: center; margin-top: 30px;">
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

    // Send the email (using verified domain)
    const emailResponse = await resend.emails.send({
      from: "True North Business Loan <leads@email.truenorthbusinessloan.ca>",
      to: [recipientEmail],
      subject: `🚀 New Qualified Lead: ${lead.name} - ${formatAmount(lead.loan_amount)} Funding Request`,
      html: emailHtml,
    });

    console.log("Lead email sent successfully:", emailResponse);

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