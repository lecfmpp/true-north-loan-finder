import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DownloadFileRequest {
  filePath: string;
  fileName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { filePath, fileName }: DownloadFileRequest = await req.json();

    if (!filePath || !fileName) {
      console.error('Missing required parameters:', { filePath, fileName });
      return new Response(
        JSON.stringify({ error: "Missing filePath or fileName" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log('Download request:', { filePath, fileName });

    // Initialize Supabase client with service role key for full access
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing Supabase configuration');
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Extract relative path from full URL if needed
    let relativePath = filePath;
    
    // Handle different URL formats
    const publicMatch = filePath.match(/\/storage\/v1\/object\/public\/application-documents\/(.+)$/);
    const privateMatch = filePath.match(/\/storage\/v1\/object\/application-documents\/(.+)$/);
    
    if (publicMatch) {
      relativePath = publicMatch[1];
    } else if (privateMatch) {
      relativePath = privateMatch[1];
    } else {
      // If it's just a filename or relative path, assume it's in applications folder
      if (!filePath.startsWith('applications/')) {
        const idx = filePath.lastIndexOf('/');
        const actualFileName = idx !== -1 ? filePath.substring(idx + 1) : filePath;
        relativePath = `applications/${actualFileName}`;
      } else {
        relativePath = filePath;
      }
    }

    console.log(`Downloading file from storage: ${relativePath}`);

    // Try to download the file using service role (bypasses RLS)
    let { data, error } = await supabase.storage
      .from('application-documents')
      .download(relativePath);

    // If direct download fails, try with signed URL as fallback
    if (error) {
      console.log('Direct download failed, trying signed URL fallback:', error.message);
      
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('application-documents')
        .createSignedUrl(relativePath, 60); // 60 seconds expiry
      
      if (signedUrlError) {
        console.error('Signed URL creation failed:', signedUrlError);
        return new Response(
          JSON.stringify({ error: `Failed to access file: ${signedUrlError.message}` }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Fetch the file using the signed URL
      const fileResponse = await fetch(signedUrlData.signedUrl);
      if (!fileResponse.ok) {
        console.error('Failed to fetch file via signed URL:', fileResponse.status);
        return new Response(
          JSON.stringify({ error: "Failed to fetch file" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      data = await fileResponse.blob();
    }

    if (!data) {
      return new Response(
        JSON.stringify({ error: "No file data received" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get file info to set proper content type
    const { data: fileInfo } = await supabase.storage
      .from('application-documents')
      .list('applications', { search: relativePath.split('/').pop() });

    // Determine content type based on file extension
    const fileExt = fileName.toLowerCase().split('.').pop();
    let contentType = 'application/octet-stream';
    
    switch (fileExt) {
      case 'pdf':
        contentType = 'application/pdf';
        break;
      case 'jpg':
      case 'jpeg':
        contentType = 'image/jpeg';
        break;
      case 'png':
        contentType = 'image/png';
        break;
      case 'doc':
        contentType = 'application/msword';
        break;
      case 'docx':
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        break;
      case 'txt':
        contentType = 'text/plain';
        break;
    }

    // Return the file data directly for download
    return new Response(data, {
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': data.size?.toString() || '0',
      }
    });

  } catch (error: any) {
    console.error("Error in download-application-file function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);