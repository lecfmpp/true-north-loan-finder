import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateMeetEventRequest {
  bookingId: string;
  userEmail: string;
  userName: string;
  userPhone?: string;
  appointmentDateTime: string;
  durationMinutes: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { bookingId, userEmail, userName, userPhone, appointmentDateTime, durationMinutes }: CreateMeetEventRequest = await req.json();

    // Get Google service account credentials from secrets
    const googleServiceAccountKey = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_KEY");
    const googleCalendarId = Deno.env.get("GOOGLE_CALENDAR_ID") || "primary";

    if (!googleServiceAccountKey) {
      throw new Error("Google service account credentials not configured");
    }

    // Parse service account key
    const serviceAccount = JSON.parse(googleServiceAccountKey);
    
    // Create JWT for Google Calendar API authentication
    const now = Math.floor(Date.now() / 1000);
    const token = await createJWT(serviceAccount, now);
    
    // Get access token from Google
    const accessToken = await getAccessToken(token);
    
    // Calculate end time
    const startTime = new Date(appointmentDateTime);
    const endTime = new Date(startTime.getTime() + durationMinutes * 60000);
    
    // Create calendar event with Google Meet
    const event = {
      summary: `Business Loan Consultation - ${userName}`,
      description: `Pre-qualified business loan consultation with ${userName}${userPhone ? `\nPhone: ${userPhone}` : ''}`,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: 'America/Toronto'
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: 'America/Toronto'
      },
      attendees: [
        { email: userEmail, responseStatus: 'needsAction' },
        { email: 'info@truenorthbusinessloan.ca' }
      ],
      conferenceData: {
        createRequest: {
          requestId: bookingId,
          conferenceSolutionKey: { type: 'hangoutsMeet' }
        }
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 24 hours before
          { method: 'email', minutes: 60 }, // 1 hour before
          { method: 'popup', minutes: 10 } // 10 minutes before
        ]
      }
    };

    // Create the calendar event
    const calendarResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${googleCalendarId}/events?conferenceDataVersion=1`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    if (!calendarResponse.ok) {
      const errorText = await calendarResponse.text();
      console.error('Google Calendar API error:', errorText);
      throw new Error(`Failed to create calendar event: ${calendarResponse.status}`);
    }

    const calendarEvent = await calendarResponse.json();
    const meetLink = calendarEvent.conferenceData?.entryPoints?.find(
      (entry: any) => entry.entryPointType === 'video'
    )?.uri;

    // Update the booking with Google Meet link and calendar event ID
    const { error: updateError } = await supabaseClient
      .from('call_bookings')
      .update({
        google_calendar_event_id: calendarEvent.id,
        google_meet_link: meetLink,
        meeting_link: meetLink,
        calendar_sync_status: 'synced'
      })
      .eq('id', bookingId);

    if (updateError) {
      console.error('Error updating booking:', updateError);
      throw new Error('Failed to update booking with meeting details');
    }

    return new Response(
      JSON.stringify({
        success: true,
        eventId: calendarEvent.id,
        meetLink: meetLink,
        calendarEventLink: calendarEvent.htmlLink
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error creating Google Meet event:", error);
    
    // Update booking status to failed
    if (req.body) {
      try {
        const { bookingId } = await req.json();
        const supabaseClient = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );
        
        await supabaseClient
          .from('call_bookings')
          .update({ calendar_sync_status: 'failed' })
          .eq('id', bookingId);
      } catch (updateError) {
        console.error('Error updating booking status to failed:', updateError);
      }
    }

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