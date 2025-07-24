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
      .select('id, name, email, phone, loan_amount, monthly_revenue, time_in_business, credit_score, use_of_funds, website, created_at, score')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      console.error('Error fetching lead:', leadError);
      return new Response(
        JSON.stringify({ error: 'Lead not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Helper function to get credit score number from classification
    const getCreditScoreNumber = (creditScore: string) => {
      switch (creditScore) {
        case "excellent": return "750+";
        case "good": return "700-749";
        case "fair": return "650-699";
        case "poor": return "Below 650";
        default: return creditScore;
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
                        <div class="info-value">${getCreditScoreNumber(lead.credit_score)} (${lead.credit_score})</div>
                    </div>
                    <div class="info-item highlight">
                        <div class="info-label">⭐ Qualification Score</div>
                        <div class="info-value">${lead.score}/100 (${lead.score >= 85 ? "Excellent" : lead.score >= 70 ? "Great" : lead.score >= 55 ? "Good" : "Fair"})</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">🎯 Use of Funds</div>
                        <div class="info-value">${lead.use_of_funds}</div>
                    </div>
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