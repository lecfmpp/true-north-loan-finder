import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Resend } from 'npm:resend@2.0.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}

interface PartnerConfirmationRequest {
  name: string
  email: string
  company_name: string
  application_type: string
  temp_password?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Partner confirmation email function called')
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { name, email, company_name, application_type, temp_password }: PartnerConfirmationRequest = await req.json()
    
    console.log('Processing confirmation email for:', { name, email, company_name, application_type })

    // Generate a secure confirmation token
    const confirmationToken = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
    
    // Store the confirmation token in the database
    const { error: tokenError } = await supabaseClient
      .from('partner_confirmation_tokens')
      .insert({
        email,
        token: confirmationToken,
        expires_at: expiresAt.toISOString(),
        used: false
      })

    if (tokenError) {
      console.error('Error storing confirmation token:', tokenError)
      return new Response(JSON.stringify({ error: 'Failed to generate confirmation token' }), {
        status: 500,
        headers: corsHeaders,
      })
    }

    // Construct confirmation URL
    const confirmationUrl = `${Deno.env.get('SITE_URL') || 'https://your-app.com'}/confirm-partner?token=${confirmationToken}`
    
    // Create email template
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Confirm Your Partner Account</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
            .button:hover { background: #5a67d8; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; border-radius: 0 0 8px 8px; }
            .info-box { background: #f0f4f8; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Welcome to Our Partner Network!</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Confirm your account to get started</p>
            </div>
            
            <div class="content">
              <h2>Hello ${name},</h2>
              
              <p>Congratulations! Your ${application_type === 'broker' ? 'Broker' : 'Lender'} application has been received for <strong>${company_name}</strong>.</p>
              
              <p>To complete your registration and access the partner portal, please confirm your account by clicking the button below:</p>
              
              <div style="text-align: center;">
                <a href="${confirmationUrl}" class="button">Confirm Account & Set Password</a>
              </div>
              
              <div class="info-box">
                <h3 style="margin-top: 0;">What happens next?</h3>
                <ol>
                  <li><strong>Click the confirmation link</strong> - This verifies your email address</li>
                  <li><strong>Create your password</strong> - Set up secure access to your account</li>
                  <li><strong>Access the partner portal</strong> - Start managing leads and applications</li>
                </ol>
              </div>
              
              <p><strong>Important:</strong> This confirmation link will expire in 24 hours. If you don't confirm your account within this time, you'll need to request a new confirmation email.</p>
              
              <p>If you're having trouble with the button above, copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 4px; font-family: monospace;">
                ${confirmationUrl}
              </p>
              
              <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
              
              <p><strong>Account Details:</strong></p>
              <ul>
                <li>Name: ${name}</li>
                <li>Email: ${email}</li>
                <li>Company: ${company_name}</li>
                <li>Type: ${application_type === 'broker' ? 'Broker' : 'Lender'}</li>
              </ul>
            </div>
            
            <div class="footer">
              <p>If you didn't request this account, please ignore this email or contact our support team.</p>
              <p style="margin: 0;">© 2024 Your Company. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `

    // Send email using Resend
    const emailResult = await resend.emails.send({
      from: 'True North Business Loan <leads@email.truenorthbusinessloan.ca>',
      to: [email],
      subject: `Welcome ${name}! Confirm your ${application_type === 'broker' ? 'Broker' : 'Lender'} account`,
      html: emailHtml,
    })

    console.log('Email sent successfully:', emailResult)

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Confirmation email sent successfully',
      confirmationToken // Remove this in production for security
    }), {
      headers: corsHeaders,
    })

  } catch (error: any) {
    console.error('Error in send-partner-confirmation function:', error)
    return new Response(JSON.stringify({ error: 'Failed to send confirmation email: ' + error.message }), {
      status: 500,
      headers: corsHeaders,
    })
  }
})