import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TestConnectionRequest {
  serviceAccountKey: string;
  calendarId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { serviceAccountKey, calendarId }: TestConnectionRequest = await req.json();

    if (!serviceAccountKey || !calendarId) {
      throw new Error('Service account key and calendar ID are required');
    }

    // Parse and validate service account key
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(serviceAccountKey);
    } catch (e) {
      throw new Error('Invalid service account key JSON format');
    }

    if (!serviceAccount.client_email || !serviceAccount.private_key) {
      throw new Error('Service account key missing required fields');
    }

    // Create JWT for Google Calendar API authentication
    const now = Math.floor(Date.now() / 1000);
    const token = await createJWT(serviceAccount, now);
    
    // Get access token from Google
    const accessToken = await getAccessToken(token);
    
    // Test calendar access by fetching calendar info
    const calendarResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!calendarResponse.ok) {
      const errorText = await calendarResponse.text();
      console.error('Google Calendar API error:', errorText);
      
      if (calendarResponse.status === 404) {
        throw new Error('Calendar not found. Check your calendar ID.');
      } else if (calendarResponse.status === 403) {
        throw new Error('Access denied. Check your service account permissions.');
      } else {
        throw new Error(`Calendar API error: ${calendarResponse.status}`);
      }
    }

    const calendarData = await calendarResponse.json();

    return new Response(
      JSON.stringify({
        success: true,
        message: "Successfully connected to Google Calendar",
        calendarInfo: {
          id: calendarData.id,
          summary: calendarData.summary,
          timeZone: calendarData.timeZone
        }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error testing Google connection:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

// Helper function to create JWT for Google API
async function createJWT(serviceAccount: any, now: number): Promise<string> {
  const header = {
    alg: "RS256",
    typ: "JWT",
    kid: serviceAccount.private_key_id
  };

  const payload = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/calendar",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now
  };

  const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  
  const data = `${encodedHeader}.${encodedPayload}`;
  
  // Import the private key
  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    str2ab(atob(serviceAccount.private_key.replace(/-----BEGIN PRIVATE KEY-----\n|-----END PRIVATE KEY-----\n/g, "").replace(/\n/g, ""))),
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );

  // Sign the data
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    privateKey,
    new TextEncoder().encode(data)
  );

  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  return `${data}.${encodedSignature}`;
}

// Helper function to convert string to ArrayBuffer
function str2ab(str: string): ArrayBuffer {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

// Helper function to get access token from Google
async function getAccessToken(jwt: string): Promise<string> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get access token: ${errorText}`);
  }

  const data = await response.json();
  return data.access_token;
}

serve(handler);