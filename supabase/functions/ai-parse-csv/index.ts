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

    // Prepare prompt for Gemini - ONLY for column mapping, not data processing
    const analysisPrompt = `You are an expert data analyst. Analyze this CSV structure for ad spend tracking.

CSV Headers: ${headers.join(', ')}

Sample Data Rows (first 3 for format detection):
${sampleRows.map((row, i) => `Row ${i + 1}: ${row.join(', ')}`).join('\n')}

I need you to identify the column mapping ONLY. Do NOT process the actual data - I will handle that programmatically.

Required Database Fields:
- date: Date of ad spend (required)
- channel: Advertising channel - must be one of: google, meta, tiktok, linkedin (required)
- amount: Spend amount in dollars (required)
- campaign_name: Campaign identifier (optional)
- clicks: Number of clicks (optional)
- ctr: Click-through rate as percentage (optional)
- conversions: Number of conversions (optional)

Respond with JSON only in this exact format:
{
  "mapping": {
    "date": 0,
    "channel": 1, 
    "amount": 2,
    "campaign_name": 3,
    "clicks": null,
    "ctr": null,
    "conversions": null
  },
  "formats": {
    "date_format": "YYYY-MM-DD or MM/DD/YYYY or DD/MM/YYYY",
    "amount_has_currency_symbol": true,
    "channel_variations": {
      "facebook": "meta",
      "fb": "meta",
      "instagram": "meta",
      "adwords": "google",
      "youtube": "google"
    }
  },
  "suggestions": ["any data quality suggestions"],
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

    // Now process ALL rows using the AI-detected mapping
    console.log('AI mapping result:', analysisResult);
    
    const allDataRows = lines.slice(1); // Skip header
    console.log(`Processing all ${allDataRows.length} data rows programmatically...`);
    
    const processedData = allDataRows.map((line, index) => {
      try {
        const row = line.split(',').map(cell => cell.trim().replace(/"/g, ''));
        
        const getColumnValue = (field: string) => {
          const columnIndex = analysisResult.mapping[field];
          return columnIndex !== null && columnIndex !== undefined ? (row[columnIndex] || '') : '';
        };

        // Extract values using the mapping
        const dateStr = getColumnValue('date');
        const channelStr = getColumnValue('channel');
        const amountStr = getColumnValue('amount');
        const campaignStr = getColumnValue('campaign_name');
        const clicksStr = getColumnValue('clicks');
        const ctrStr = getColumnValue('ctr');
        const conversionsStr = getColumnValue('conversions');

        // Process and validate the data
        const processedRow = {
          date: standardizeDate(dateStr, analysisResult.formats?.date_format),
          channel: standardizeChannel(channelStr, analysisResult.formats?.channel_variations),
          amount: Math.round(parseAmount(amountStr) * 100), // Convert to cents
          campaign_name: campaignStr || `Campaign ${index + 1}`,
          clicks: parseInt(clicksStr) || 0,
          ctr: parseFloat(ctrStr.replace('%', '')) || 0,
          conversions: parseInt(conversionsStr) || 0
        };

        // Validate required fields
        if (!processedRow.date || !processedRow.channel || processedRow.amount <= 0) {
          console.warn(`Skipping invalid row ${index + 1}:`, row);
          return null;
        }

        return processedRow;
      } catch (error) {
        console.error(`Error processing row ${index + 1}:`, error);
        return null;
      }
    }).filter(row => row !== null); // Remove invalid rows

    console.log(`Successfully processed ${processedData.length} out of ${allDataRows.length} rows`);

    // Insert all processed data in batches
    const batchSize = 100;
    let totalInserted = 0;
    
    for (let i = 0; i < processedData.length; i += batchSize) {
      const batch = processedData.slice(i, i + batchSize);
      
      const { data: insertData, error: insertError } = await supabase
        .from('ad_spend_records')
        .insert(batch);

      if (insertError) {
        console.error(`Database insert error for batch ${Math.floor(i / batchSize) + 1}:`, insertError);
        throw new Error(`Failed to insert batch: ${insertError.message}`);
      }
      
      totalInserted += batch.length;
      console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}: ${batch.length} records`);
    }

    console.log(`Successfully processed and inserted ${totalInserted} records out of ${allDataRows.length} total rows`);

    return new Response(
      JSON.stringify({
        success: true,
        inserted: totalInserted,
        processed: allDataRows.length,
        analysis: {
          mapping: analysisResult.mapping,
          formats: analysisResult.formats,
          suggestions: analysisResult.suggestions,
          confidence: analysisResult.confidence
        },
        message: `Successfully processed ${totalInserted} out of ${allDataRows.length} ad spend records with AI-assisted analysis`
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

// Initialize Supabase client at module level
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to parse amount strings
function parseAmount(amountStr: string): number {
  if (!amountStr) return 0;
  
  // Remove currency symbols and spaces, keep only numbers, dots, and minus signs
  const cleanAmount = amountStr.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleanAmount);
  
  return isNaN(parsed) ? 0 : Math.abs(parsed); // Ensure positive values
}

// Helper function to standardize dates with format detection
function standardizeDate(dateStr: string, detectedFormat?: string): string {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  
  try {
    dateStr = dateStr.trim().replace(/"/g, '');
    
    // Try parsing based on detected format first
    if (detectedFormat?.includes('MM/DD/YYYY') && dateStr.includes('/')) {
      const [month, day, year] = dateStr.split('/');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
    
    if (detectedFormat?.includes('DD/MM/YYYY') && dateStr.includes('/')) {
      const [day, month, year] = dateStr.split('/');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
    
    // Try standard ISO format or built-in parsing
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    
    // If all else fails, try different separators
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        // Try different arrangements
        const arrangements = [
          [parts[2], parts[0], parts[1]], // YYYY, MM, DD
          [parts[2], parts[1], parts[0]], // YYYY, DD, MM
        ];
        
        for (const [year, month, day] of arrangements) {
          const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
          }
        }
      }
    }
    
    return new Date().toISOString().split('T')[0];
  } catch (error) {
    console.warn('Date parsing error:', error);
    return new Date().toISOString().split('T')[0];
  }
}

// Helper function to standardize channel names with variation mapping
function standardizeChannel(channel: string, variations?: Record<string, string>): string {
  if (!channel) return 'google';
  
  const cleanChannel = channel.toLowerCase().trim();
  
  // Use AI-detected variations first
  if (variations) {
    for (const [original, standardized] of Object.entries(variations)) {
      if (cleanChannel.includes(original.toLowerCase())) {
        return standardized;
      }
    }
  }
  
  // Fallback to built-in mappings
  if (cleanChannel.includes('facebook') || cleanChannel.includes('meta') || cleanChannel.includes('fb') || cleanChannel.includes('instagram')) return 'meta';
  if (cleanChannel.includes('google') || cleanChannel.includes('adwords') || cleanChannel.includes('youtube')) return 'google';
  if (cleanChannel.includes('tiktok') || cleanChannel.includes('tik-tok')) return 'tiktok';
  if (cleanChannel.includes('linkedin') || cleanChannel.includes('linked-in')) return 'linkedin';
  
  // Default to google if unrecognized
  return 'google';
}