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

    // Extract a clean relative path from various input formats
    const normalizePath = (input: string): string => {
      try {
        // Strip query/hash and get pathname when it's a full URL
        if (/^https?:\/\//i.test(input)) {
          const u = new URL(input);
          input = decodeURIComponent(u.pathname);
        } else {
          input = decodeURIComponent(input);
        }
      } catch (_) {
        // If URL parsing fails, continue with raw input
      }

      // Remove known Supabase storage prefixes
      input = input
        .replace(/\/storage\/v1\/object\/public\/application-documents\//, '')
        .replace(/\/storage\/v1\/object\/application-documents\//, '')
        .replace(/^\/+/, '');

      // If it's already a valid storage path, return as-is
      if (input.startsWith('applications/')) {
        return input;
      }

      // If it's only a filename, default to applications/ prefix
      if (!input.includes('/')) {
        return `applications/${input}`;
      }

      // Extract just the filename if it looks like a full path
      const lastSegment = input.split('/').pop() || input;
      return `applications/${lastSegment}`;
    };

    let relativePath = normalizePath(filePath);
    console.log('Normalized storage path:', relativePath);

    console.log(`Downloading file from storage: ${relativePath}`);

    // Try multiple key variants to handle different storage patterns
    const candidateKeys = Array.from(new Set([
      relativePath,
      relativePath.replace(/^applications\//, ''),
      relativePath.includes('/') ? relativePath.split('/').pop() : relativePath,
      `applications/${relativePath.split('/').pop()}`,
    ].filter(Boolean)));

    let data: Blob | null = null;
    let lastErr: any = null;

    for (const key of candidateKeys) {
      console.log('Attempting direct download using key:', key);
      const { data: d, error: e } = await supabase.storage
        .from('application-documents')
        .download(key);

      if (!e && d) {
        data = d as Blob;
        relativePath = key; // found working key
        break;
      }

      lastErr = e;
      console.log('Direct download failed for key:', key, e?.message || e || 'unknown');
    }

    // If direct download failed for all candidates, try signed URL with the first candidate
    if (!data) {
      const key = candidateKeys[0];
      console.log('Direct download failed, trying signed URL fallback for key:', key);
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('application-documents')
        .createSignedUrl(key, 60); // 60 seconds expiry

      if (signedUrlError) {
        console.error('Signed URL creation failed:', signedUrlError);
        return new Response(
          JSON.stringify({ error: `Failed to access file: ${signedUrlError.message}`, tried: candidateKeys }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const fileResponse = await fetch(signedUrlData.signedUrl);
      if (!fileResponse.ok) {
        console.error('Failed to fetch file via signed URL:', fileResponse.status);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch file', tried: candidateKeys }),
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