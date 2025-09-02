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
      for (const filePath of application.document_files) {
        try {
          // Extract the storage path from various URL formats
          let storageFilePath = filePath;
          
          if (filePath.startsWith('http')) {
            // Handle both public and private URL formats
            // Private: https://project.supabase.co/storage/v1/object/application-documents/path
            // Public: https://project.supabase.co/storage/v1/object/public/application-documents/path
            const privateMatch = filePath.match(/\/storage\/v1\/object\/application-documents\/(.+)$/);
            const publicMatch = filePath.match(/\/storage\/v1\/object\/public\/application-documents\/(.+)$/);
            
            if (publicMatch) {
              storageFilePath = publicMatch[1];
            } else if (privateMatch) {
              storageFilePath = privateMatch[1];
            } else {
              // If no match, try to extract the file name from the path
              const urlParts = filePath.split('/');
              const fileNameWithTimestamp = urlParts[urlParts.length - 1];
              storageFilePath = `applications/${fileNameWithTimestamp}`;
            }
          }
          
          console.log(`Downloading file: ${storageFilePath}`);
          
          // Try to download using the service role key (has access to private buckets)
          const { data: fileData, error: fileError } = await supabase.storage
            .from('application-documents')
            .download(storageFilePath);

          if (!fileError && fileData) {
            console.log(`Successfully downloaded file: ${storageFilePath}`);
            const arrayBuffer = await fileData.arrayBuffer();
            const base64String = btoa(
              String.fromCharCode(...new Uint8Array(arrayBuffer))
            );
            
            // Extract filename from path (get the original filename if possible)
            let fileName = filePath.split('/').pop() || filePath;
            if (fileName.includes('-')) {
              // Remove timestamp prefix from filename (format: timestamp-originalname)
              const parts = fileName.split('-');
              if (parts.length > 1) {
                fileName = parts.slice(1).join('-');
              }
            }
            
            attachments.push({
              filename: fileName,
              content: base64String,
            });
          } else {
            console.error(`Failed to download file ${storageFilePath}:`, fileError);
            
            // If the direct path failed, try with 'applications/' prefix
            if (!storageFilePath.startsWith('applications/')) {
              const alternativePath = `applications/${storageFilePath}`;
              console.log(`Retrying with path: ${alternativePath}`);
              
              const { data: retryData, error: retryError } = await supabase.storage
                .from('application-documents')
                .download(alternativePath);
                
              if (!retryError && retryData) {
                console.log(`Successfully downloaded file on retry: ${alternativePath}`);
                const arrayBuffer = await retryData.arrayBuffer();
                const base64String = btoa(
                  String.fromCharCode(...new Uint8Array(arrayBuffer))
                );
                
                let fileName = filePath.split('/').pop() || filePath;
                if (fileName.includes('-')) {
                  const parts = fileName.split('-');
                  if (parts.length > 1) {
                    fileName = parts.slice(1).join('-');
                  }
                }
                
                attachments.push({
                  filename: fileName,
                  content: base64String,
                });
              } else {
                console.error(`Retry also failed for ${alternativePath}:`, retryError);
              }
            }
          }
        } catch (error) {
          console.error('File processing error for', filePath, ':', error);
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