import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
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
      throw new Error('GEMINI_API_KEY not configured');
    }

    console.log('Starting AI-powered CSV analysis...');

    // Parse CSV structure
    const lines = csvContent.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV must have at least a header row and one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const sampleRows = lines.slice(1, 4).map(line => 
      line.split(',').map(cell => cell.trim().replace(/"/g, ''))
    );

    // Prepare prompt for Gemini
    const analysisPrompt = `You are an expert data analyst. Analyze this CSV data for ad spend tracking.

CSV Headers: ${headers.join(', ')}

Sample Data Rows:
${sampleRows.map((row, i) => `Row ${i + 1}: ${row.join(', ')}`).join('\n')}

Required Database Fields:
- date: Date of ad spend (required)
- channel: Advertising channel - must be one of: google, meta, tiktok, linkedin (required)
- amount: Spend amount in dollars (required)
- campaign_name: Campaign identifier (optional)
- clicks: Number of clicks (optional)
- ctr: Click-through rate as percentage (optional)
- conversions: Number of conversions (optional)

Please analyze the CSV and provide:
1. Column mapping from CSV headers to database fields
2. Data validation and cleaning suggestions
3. Channel name standardization (map variations to: google, meta, tiktok, linkedin)
4. Date format standardization
5. Amount conversion (ensure it's in dollars)

Respond with JSON only in this exact format:
{
  "mapping": {
    "date": "CSV_HEADER_NAME",
    "channel": "CSV_HEADER_NAME", 
    "amount": "CSV_HEADER_NAME",
    "campaign_name": "CSV_HEADER_NAME",
    "clicks": "CSV_HEADER_NAME",
    "ctr": "CSV_HEADER_NAME",
    "conversions": "CSV_HEADER_NAME"
  },
  "validation": {
    "date_format": "detected_format",
    "amount_format": "detected_format",
    "channel_standardization": {
      "original_value": "standardized_value"
    }
  },
  "cleaned_data": [
    {
      "date": "2024-01-01",
      "channel": "google",
      "amount": 100.50,
      "campaign_name": "Campaign Name",
      "clicks": 1000,
      "ctr": 2.5,
      "conversions": 25
    }
  ],
  "suggestions": ["list of improvement suggestions"],
  "confidence": 0.95
}`;

    // Call Gemini API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: analysisPrompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            topK: 1,
            topP: 1,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    const aiResponse = geminiData.candidates[0].content.parts[0].text;
    
    console.log('Gemini AI Response:', aiResponse);

    // Parse AI response
    let analysisResult;
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/) || aiResponse.match(/```\n([\s\S]*?)\n```/);
      const jsonString = jsonMatch ? jsonMatch[1] : aiResponse;
      analysisResult = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      throw new Error('Failed to parse AI analysis results');
    }

    // Process and validate the cleaned data
    const processedData = analysisResult.cleaned_data.map(row => ({
      date: row.date,
      channel: row.channel,
      amount: Math.round(row.amount * 100), // Convert to cents
      campaign_name: row.campaign_name || '',
      clicks: row.clicks || 0,
      ctr: row.ctr || 0,
      conversions: row.conversions || 0
    }));

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Insert the processed data
    const { data: insertData, error: insertError } = await supabase
      .from('ad_spend_records')
      .insert(processedData);

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw new Error(`Failed to insert data: ${insertError.message}`);
    }

    console.log(`Successfully processed and inserted ${processedData.length} records`);

    return new Response(
      JSON.stringify({
        success: true,
        inserted: processedData.length,
        analysis: {
          mapping: analysisResult.mapping,
          validation: analysisResult.validation,
          suggestions: analysisResult.suggestions,
          confidence: analysisResult.confidence
        },
        message: `Successfully processed ${processedData.length} ad spend records with AI analysis`
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in ai-parse-csv function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        message: 'Failed to process CSV with AI analysis'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});