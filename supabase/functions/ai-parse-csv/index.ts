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
    const analysisPrompt = `You are an expert data analyst. Analyze this CSV data for ad spend tracking and process ALL rows.

CSV Headers: ${headers.join(', ')}

Sample Data Rows (first 3):
${sampleRows.map((row, i) => `Row ${i + 1}: ${row.join(', ')}`).join('\n')}

Total rows to process: ${lines.length - 1}

Required Database Fields:
- date: Date of ad spend (required)
- channel: Advertising channel - must be one of: google, meta, tiktok, linkedin (required)
- amount: Spend amount in dollars (required)
- campaign_name: Campaign identifier (optional)
- clicks: Number of clicks (optional)
- ctr: Click-through rate as percentage (optional)
- conversions: Number of conversions (optional)

Please analyze the CSV structure and provide a column mapping. Then process ALL ${lines.length - 1} rows and return the cleaned data for each row.

Respond with JSON only in this exact format:
{
  "mapping": {
    "date": "column_index_number",
    "channel": "column_index_number", 
    "amount": "column_index_number",
    "campaign_name": "column_index_number_or_null",
    "clicks": "column_index_number_or_null",
    "ctr": "column_index_number_or_null",
    "conversions": "column_index_number_or_null"
  },
  "validation": {
    "date_format": "YYYY-MM-DD or MM/DD/YYYY or DD/MM/YYYY",
    "amount_format": "dollars with or without symbols",
    "channel_standardization": {
      "facebook": "meta",
      "fb": "meta",
      "instagram": "meta",
      "adwords": "google",
      "youtube": "google"
    }
  },
  "cleaned_data": [
    ${lines.slice(1).map((_, index) => `{
      "date": "standardized_date_${index + 1}",
      "channel": "standardized_channel_${index + 1}",
      "amount": amount_in_dollars_${index + 1},
      "campaign_name": "campaign_${index + 1}",
      "clicks": clicks_${index + 1},
      "ctr": ctr_percentage_${index + 1},
      "conversions": conversions_${index + 1}
    }`).slice(0, 3).join(',')}
    // ... process all ${lines.length - 1} rows
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

    // Process and validate the cleaned data from ALL rows
    if (!analysisResult.cleaned_data || !Array.isArray(analysisResult.cleaned_data)) {
      throw new Error('AI did not return valid cleaned data array');
    }

    // If AI didn't process all rows, manually process the remaining ones using the mapping
    let allProcessedData = analysisResult.cleaned_data;
    
    if (allProcessedData.length < lines.length - 1) {
      console.log(`AI processed ${allProcessedData.length} rows, manually processing remaining ${lines.length - 1 - allProcessedData.length} rows`);
      
      // Process remaining rows using the mapping
      const dataRows = lines.slice(1 + allProcessedData.length);
      const additionalData = dataRows.map(line => {
        const row = line.split(',').map(cell => cell.trim().replace(/"/g, ''));
        return processRowWithMapping(row, analysisResult.mapping, analysisResult.validation);
      });
      
      allProcessedData = [...allProcessedData, ...additionalData];
    }

    const processedData = allProcessedData.map(row => ({
      date: standardizeDate(row.date),
      channel: standardizeChannel(row.channel),
      amount: Math.round((parseFloat(String(row.amount)) || 0) * 100), // Convert to cents
      campaign_name: String(row.campaign_name || ''),
      clicks: parseInt(String(row.clicks || '0')) || 0,
      ctr: parseFloat(String(row.ctr || '0')) || 0,
      conversions: parseInt(String(row.conversions || '0')) || 0
    })).filter(row => row.date && row.channel && row.amount > 0); // Filter out invalid rows

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

    console.log(`Successfully processed and inserted ${processedData.length} records out of ${lines.length - 1} total rows`);

    return new Response(
      JSON.stringify({
        success: true,
        inserted: processedData.length,
        processed: lines.length - 1,
        analysis: {
          mapping: analysisResult.mapping,
          validation: analysisResult.validation,
          suggestions: analysisResult.suggestions,
          confidence: analysisResult.confidence
        },
        message: `Successfully processed ${processedData.length} out of ${lines.length - 1} ad spend records with AI analysis`
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

// Helper function to process a single row using the mapping
function processRowWithMapping(row: string[], mapping: any, validation: any) {
  const getColumnValue = (field: string) => {
    const index = mapping[field];
    return index !== null && index !== undefined ? row[parseInt(index)] || '' : '';
  };

  return {
    date: getColumnValue('date'),
    channel: getColumnValue('channel'),
    amount: parseFloat(getColumnValue('amount').replace(/[^0-9.-]/g, '')) || 0,
    campaign_name: getColumnValue('campaign_name'),
    clicks: parseInt(getColumnValue('clicks')) || 0,
    ctr: parseFloat(getColumnValue('ctr').replace('%', '')) || 0,
    conversions: parseInt(getColumnValue('conversions')) || 0
  };
}

// Helper function to standardize dates
function standardizeDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  
  try {
    // Try different date formats
    let date = new Date(dateStr);
    
    // If that fails, try parsing MM/DD/YYYY or DD/MM/YYYY
    if (isNaN(date.getTime()) && dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        // Try MM/DD/YYYY first
        date = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
        
        // If that results in invalid date, try DD/MM/YYYY
        if (isNaN(date.getTime())) {
          date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        }
      }
    }
    
    return isNaN(date.getTime()) ? new Date().toISOString().split('T')[0] : date.toISOString().split('T')[0];
  } catch (error) {
    return new Date().toISOString().split('T')[0];
  }
}

// Helper function to standardize channel names
function standardizeChannel(channel: string): string {
  if (!channel) return 'google';
  
  const cleanChannel = channel.toLowerCase().trim();
  
  if (cleanChannel.includes('facebook') || cleanChannel.includes('meta') || cleanChannel.includes('fb') || cleanChannel.includes('instagram')) return 'meta';
  if (cleanChannel.includes('google') || cleanChannel.includes('adwords') || cleanChannel.includes('youtube')) return 'google';
  if (cleanChannel.includes('tiktok') || cleanChannel.includes('tik-tok')) return 'tiktok';
  if (cleanChannel.includes('linkedin') || cleanChannel.includes('linked-in')) return 'linkedin';
  
  // Default to google if unrecognized
  return 'google';
}