import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendApplicationEmailRequest {
  applicationId: string;
  recipientEmail: string;
  applicationType: 'canadian' | 'usa';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { applicationId, recipientEmail, applicationType }: SendApplicationEmailRequest = await req.json();

    if (!applicationId || !recipientEmail || !applicationType) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Initialize Resend
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    // Fetch application data
    const tableName = applicationType === 'canadian' ? 'canadian_applications' : 'usa_applications';
    const { data: application, error: appError } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', applicationId)
      .single();

    if (appError || !application) {
      console.error('Application fetch error:', appError);
      return new Response(
        JSON.stringify({ error: "Application not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prepare attachments from document files
    const attachments = [];
    
    if (application.document_files && Array.isArray(application.document_files)) {
      for (const file of application.document_files) {
        try {
          const { data: fileData, error: fileError } = await supabase.storage
            .from('application-documents')
            .download(file.path);

          if (!fileError && fileData) {
            const arrayBuffer = await fileData.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            
            // Convert to base64 string for Resend
            const base64String = btoa(String.fromCharCode(...uint8Array));
            
            attachments.push({
              filename: file.name,
              content: base64String,
            });
          }
        } catch (error) {
          console.error('File processing error:', error);
        }
      }
    }

    // Generate email content
    const businessName = application.legal_business_name || application.company_name || 'N/A';
    const principalName = application.principal_owner_name || application.principal_name || 'N/A';
    const refNumber = application.application_reference_number || 'N/A';
    const amountRequested = application.amount_requested || application.loan_amount_requested || 0;

    const emailContent = `
      <h1>Complete Application Details</h1>
      
      <h2>Application Overview</h2>
      <p><strong>Reference Number:</strong> ${refNumber}</p>
      <p><strong>Application Type:</strong> ${applicationType.toUpperCase()}</p>
      <p><strong>Status:</strong> ${application.status}</p>
      <p><strong>Submission Date:</strong> ${new Date(application.created_at).toLocaleDateString()}</p>
      
      <h2>Business Information</h2>
      <p><strong>Legal Business Name:</strong> ${businessName}</p>
      <p><strong>DBA Name:</strong> ${application.dba_name || 'N/A'}</p>
      <p><strong>Principal Owner:</strong> ${principalName}</p>
      <p><strong>Email:</strong> ${application.email_address || application.principal_email || 'N/A'}</p>
      <p><strong>Phone:</strong> ${application.business_phone || application.telephone_number || 'N/A'}</p>
      <p><strong>Address:</strong> ${application.physical_address || 'N/A'}</p>
      <p><strong>City, State ZIP:</strong> ${application.city || 'N/A'}, ${application.state || 'N/A'} ${application.zip || 'N/A'}</p>
      
      <h2>Financial Information</h2>
      <p><strong>Amount Requested:</strong> $${amountRequested.toLocaleString()}</p>
      <p><strong>Annual Gross Sales:</strong> $${(application.annual_gross_sales || 0).toLocaleString()}</p>
      <p><strong>Monthly Revenue:</strong> $${(application.monthly_revenue || 0).toLocaleString()}</p>
      
      ${application.admin_notes ? `<h2>Admin Notes</h2><p>${application.admin_notes}</p>` : ''}
      
      <hr>
      <p><em>This email contains the complete application details and all submitted documents as attachments.</em></p>
    `;

    // Send email
    const emailResponse = await resend.emails.send({
      from: "True North Business Loan <leads@email.truenorthbusinessloan.ca>",
      to: [recipientEmail],
      subject: `Complete Application Details - ${refNumber} (${businessName})`,
      html: emailContent,
      attachments: attachments,
    });

    if (emailResponse.error) {
      console.error("Email send error:", emailResponse.error);
      return new Response(
        JSON.stringify({ error: "Failed to send email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Application email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailId: emailResponse.data?.id,
        attachmentCount: attachments.length 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in send-application-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);