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
      return new Response(
        JSON.stringify({ error: "Missing filePath or fileName" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client with service role key for full access
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

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

    // Download the file using service role (bypasses RLS)
    const { data, error } = await supabase.storage
      .from('application-documents')
      .download(relativePath);

    if (error) {
      console.error('Storage download error:', error);
      return new Response(
        JSON.stringify({ error: `Failed to download file: ${error.message}` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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
        'Content-Length': data.size.toString(),
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