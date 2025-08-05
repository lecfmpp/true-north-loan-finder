import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ParsedAdSpend {
  date: string;
  channel: string;
  amount: number;
  campaign_name?: string;
  notes?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { csvContent } = await req.json();
    
    if (!csvContent) {
      throw new Error('CSV content is required');
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    // Use Gemini to parse and validate CSV data
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Parse this CSV data for ad spend records. Extract the following fields for each row:
- date (convert to YYYY-MM-DD format)
- channel (must be one of: google, meta, tiktok, linkedin - map similar names to these)
- amount (convert to number, remove currency symbols)
- campaign_name (optional)
- notes (optional)

Return ONLY a valid JSON array of objects. If a row is invalid or missing required fields (date, channel, amount), skip it.

CSV Data:
${csvContent}

Expected format:
[{"date": "2024-01-01", "channel": "google", "amount": 100.50, "campaign_name": "Q1 Campaign", "notes": "Test campaign"}]`
          }]
        }]
      }),
    });

    if (!geminiResponse.ok) {
      throw new Error(`Gemini API error: ${geminiResponse.statusText}`);
    }

    const geminiData = await geminiResponse.json();
    const generatedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error('No response from Gemini API');
    }

    // Extract JSON from the response
    let parsedData: ParsedAdSpend[];
    try {
      // Remove any markdown formatting or extra text
      const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No valid JSON array found in response');
      }
      parsedData = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      throw new Error(`Failed to parse Gemini response as JSON: ${parseError.message}`);
    }

    // Validate the parsed data
    const validRecords = parsedData.filter(record => {
      return record.date && 
             record.channel && 
             typeof record.amount === 'number' &&
             ['google', 'meta', 'tiktok', 'linkedin'].includes(record.channel);
    });

    if (validRecords.length === 0) {
      throw new Error('No valid ad spend records found in CSV');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Insert records into database
    const recordsToInsert = validRecords.map(record => ({
      date: record.date,
      channel: record.channel,
      amount: Math.round(record.amount * 100), // Convert to cents
      campaign_name: record.campaign_name || null,
      notes: record.notes || null
    }));

    const { data, error } = await supabase
      .from('ad_spend_records')
      .insert(recordsToInsert)
      .select();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        inserted: data?.length || 0,
        total_processed: validRecords.length,
        records: data
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error processing CSV:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});