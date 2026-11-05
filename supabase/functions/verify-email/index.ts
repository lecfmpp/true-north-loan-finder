import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Where to send the browser after verification. Supabase Edge Functions can no
// longer serve rendered HTML to a browser — the platform forces the response to
// text/plain + nosniff, so any HTML page is shown as raw source code. Instead we
// do the work here and 302-redirect to a real, branded page on the site, which
// renders the outcome from the ?status= query param (see src/pages/EmailVerified.tsx).
const SITE_URL = Deno.env.get('SITE_URL') || 'https://truenorthbusinessloan.ca';

const redirectTo = (status: 'success' | 'invalid' | 'expired' | 'error'): Response => {
  return new Response(null, {
    status: 302,
    headers: {
      Location: `${SITE_URL}/email-verified?status=${status}`,
      ...corsHeaders,
    },
  });
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    console.log('Starting email verification process for token:', token);

    if (!token) {
      return redirectTo('invalid');
    }

    // Find lead with this verification token
    console.log('Looking for lead with token:', token);
    const { data: lead, error: findError } = await supabase
      .from('quiz_responses')
      .select('*')
      .eq('email_verification_token', token)
      .eq('email_verified', false)
      .single();

    console.log('Database query result:', { lead: lead?.id, error: findError });

    if (findError || !lead) {
      console.error('Lead not found or already verified:', findError);
      return redirectTo('invalid');
    }

    // Check if verification was sent within last 24 hours
    const sentAt = new Date(lead.email_verification_sent_at);
    const now = new Date();
    const hoursDiff = (now.getTime() - sentAt.getTime()) / (1000 * 60 * 60);

    if (hoursDiff > 24) {
      return redirectTo('expired');
    }

    // Mark email as verified
    const { error: updateError } = await supabase
      .from('quiz_responses')
      .update({
        email_verified: true,
        email_verified_at: new Date().toISOString(),
        email_verification_token: null // Clear token after successful verification
      })
      .eq('id', lead.id);

    if (updateError) {
      console.error('Error updating lead verification status:', updateError);
      throw new Error('Failed to update verification status');
    }

    console.log(`Email verified successfully for lead ${lead.id}`);

    return redirectTo('success');

  } catch (error: any) {
    console.error("Error in verify-email function:", error);
    return redirectTo('error');
  }
};

serve(handler);
