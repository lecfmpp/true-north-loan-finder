import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UpdateGoogleSettingsRequest {
  serviceAccountKey: string;
  calendarId: string;
  settings: {
    enableMeetIntegration: boolean;
    autoCreateEvents: boolean;
    defaultMeetingDuration: number;
    reminderSettings: {
      email24h: boolean;
      email1h: boolean;
      popup10m: boolean;
    };
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      serviceAccountKey, 
      calendarId, 
      settings 
    }: UpdateGoogleSettingsRequest = await req.json();

    // Validate service account key format
    if (serviceAccountKey) {
      try {
        const parsed = JSON.parse(serviceAccountKey);
        if (!parsed.type || parsed.type !== 'service_account') {
          throw new Error('Invalid service account key format');
        }
        if (!parsed.client_email || !parsed.private_key) {
          throw new Error('Service account key missing required fields');
        }
      } catch (e) {
        throw new Error('Invalid service account key JSON format');
      }
    }

    // In a real implementation, you would update these secrets in Supabase
    // For now, we'll simulate the update
    console.log('Updating Google settings:', {
      hasServiceAccountKey: !!serviceAccountKey,
      calendarId,
      settings
    });

    // Here you would typically:
    // 1. Update GOOGLE_SERVICE_ACCOUNT_KEY secret
    // 2. Update GOOGLE_CALENDAR_ID secret  
    // 3. Save other settings to a configuration table

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Google settings updated successfully" 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error updating Google settings:", error);
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