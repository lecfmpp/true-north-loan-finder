import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  console.log('Request method:', req.method);
  console.log('Request headers:', Object.fromEntries(req.headers.entries()));

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405,
      headers: corsHeaders 
    });
  }

  try {
    console.log('Starting CSV processing...');
    const requestBody = await req.json();
    console.log('Request body keys:', Object.keys(requestBody));
    
    const { csvContent, batchSize = 50 } = requestBody;
    
    if (!csvContent) {
      console.error('No CSV content provided');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'CSV content is required' 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
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

    // For larger files, use a simplified approach to avoid timeouts
    const totalRows = lines.length - 1;
    console.log(`Processing ${totalRows} rows...`);
    
     // If file is too large, skip AI analysis and use pattern matching
     if (totalRows > 100) {
       console.log('Large file detected, using pattern-based processing...');
       // Initialize Supabase client
       const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
       const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
       const supabase = createClient(supabaseUrl, supabaseKey);
       return await processLargeFileDirectly(lines, supabase);
     }
 
     // Initialize Supabase client for smaller files too
     const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
     const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
     const supabase = createClient(supabaseUrl, supabaseKey);



    const analysisPrompt = `Analyze this CSV for ad spend data. Return ONLY valid JSON.

Headers: ${headers.join(', ')}
Sample rows: ${JSON.stringify(sampleRows)}

Return column indices (0-based) for mapping:
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

    // Process with AI-detected mapping
    return await processWithMapping(lines, analysisResult.mapping, supabase);

  } catch (error) {
    console.error('Error in ai-parse-csv function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Unknown error occurred',
        details: error.stack || 'No stack trace available'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Function to handle large files without AI analysis
async function processLargeFileDirectly(lines: string[], supabase: any) {
  try {
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const dataRows = lines.slice(1);
    
    // Use pattern matching for column detection
    const mapping = detectColumnsPattern(headers);
    console.log('Pattern-detected mapping:', mapping);
    
    return await processWithMapping(lines, mapping, supabase);
  } catch (error) {
    throw new Error(`Large file processing failed: ${error.message}`);
  }
}

// Function to process data with given mapping
async function processWithMapping(lines: string[], mapping: any, supabase: any) {
  try {
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const allDataRows = lines.slice(1);
    
    console.log(`Processing ${allDataRows.length} rows with mapping:`, mapping);
    
    // Process in smaller batches to avoid memory issues
    const batchSize = 50;
    let totalInserted = 0;
    const processedData: any[] = [];
    
    for (let i = 0; i < allDataRows.length; i += batchSize) {
      const batch = allDataRows.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(allDataRows.length / batchSize)}`);
      
      const batchData = batch.map((line, index) => {
        try {
          const row = line.split(',').map(cell => cell.trim().replace(/"/g, ''));
          return processRow(row, mapping, i + index + 1);
        } catch (error) {
          console.warn(`Error processing row ${i + index + 1}:`, error);
          return null;
        }
      }).filter(row => row !== null);
      
      if (batchData.length > 0) {
        const { data, error } = await supabase
          .from('ad_spend_records')
          .insert(batchData);

        if (error) {
          console.error(`Batch ${Math.floor(i / batchSize) + 1} insert error:`, error);
          // Continue with next batch instead of failing completely
        } else {
          totalInserted += batchData.length;
          processedData.push(...batchData);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        inserted: totalInserted,
        processed: allDataRows.length,
        analysis: {
          mapping,
          confidence: 0.85,
          suggestions: ['Data processed in batches for optimal performance']
        },
        message: `Successfully processed ${totalInserted} out of ${allDataRows.length} ad spend records`
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    throw new Error(`Processing failed: ${error.message}`);
  }
}

// Pattern-based column detection for large files
function detectColumnsPattern(headers: string[]) {
  const mapping: any = {
    date: null,
    channel: null,
    amount: null,
    campaign_name: null,
    clicks: null,
    ctr: null,
    conversions: null
  };

  headers.forEach((header, index) => {
    const cleanHeader = header.toLowerCase().trim();
    
    // Date patterns
    if (/date|time|day|period/.test(cleanHeader) && mapping.date === null) {
      mapping.date = index;
    }
    // Channel patterns
    else if (/channel|platform|source|medium|network/.test(cleanHeader) && mapping.channel === null) {
      mapping.channel = index;
    }
    // Amount patterns
    else if (/amount|spend|cost|budget|price|value|total/.test(cleanHeader) && mapping.amount === null) {
      mapping.amount = index;
    }
    // Campaign patterns
    else if (/campaign|name|title|ad/.test(cleanHeader) && mapping.campaign_name === null) {
      mapping.campaign_name = index;
    }
    // Clicks patterns
    else if (/clicks?|visit/.test(cleanHeader) && mapping.clicks === null) {
      mapping.clicks = index;
    }
    // CTR patterns
    else if (/ctr|rate/.test(cleanHeader) && mapping.ctr === null) {
      mapping.ctr = index;
    }
    // Conversions patterns
    else if (/conversion|conv|action/.test(cleanHeader) && mapping.conversions === null) {
      mapping.conversions = index;
    }
  });

  return mapping;
}

// Process a single row with mapping
function processRow(row: string[], mapping: any, rowIndex: number) {
  const getColumnValue = (field: string) => {
    const index = mapping[field];
    return index !== null && index !== undefined ? (row[index] || '') : '';
  };

  const dateStr = getColumnValue('date');
  const channelStr = getColumnValue('channel');
  const amountStr = getColumnValue('amount');

  const processedRow = {
    date: standardizeDate(dateStr),
    channel: standardizeChannel(channelStr),
    amount: Math.round(parseAmount(amountStr) * 100), // Convert to cents
    campaign_name: getColumnValue('campaign_name') || `Campaign ${rowIndex}`,
    clicks: Math.min(parseInt(getColumnValue('clicks')) || 0, 1000000), // Cap clicks at 1M
    ctr: Math.min(Math.max(parseFloat(getColumnValue('ctr').replace('%', '')) || 0, 0), 100), // CTR between 0-100%
    conversions: Math.min(parseInt(getColumnValue('conversions')) || 0, 100000) // Cap conversions at 100k
  };

  // Additional validation for amount overflow
  if (processedRow.amount > 10000000) { // More than $100,000 in cents
    console.warn(`Amount ${processedRow.amount} cents exceeds reasonable limit, capping to $100,000`);
    processedRow.amount = 10000000; // $100,000 in cents
  }

  // More lenient validation - only require valid date and positive amount
  if (!processedRow.date || processedRow.amount <= 0) {
    console.warn(`Row ${rowIndex} skipped: date=${processedRow.date}, amount=${processedRow.amount}`);
    return null;
  }

  console.log(`Row ${rowIndex} processed:`, {
    date: processedRow.date,
    channel: processedRow.channel,
    amount: processedRow.amount,
    campaign_name: processedRow.campaign_name
  });

  return processedRow;
}

// Helper function to parse amount strings with overflow protection
function parseAmount(amountStr: string): number {
  if (!amountStr) return 0;
  
  // Remove currency symbols and spaces, keep only numbers, dots, and minus signs
  const cleanAmount = amountStr.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleanAmount);
  
  if (isNaN(parsed)) return 0;
  
  // Prevent numeric overflow - PostgreSQL INTEGER max is 2,147,483,647 cents (about $21M)
  // Limit to reasonable ad spend amounts (max $100,000)
  const maxAmount = 100000; // $100,000 max
  const absoluteAmount = Math.abs(parsed);
  
  if (absoluteAmount > maxAmount) {
    console.warn(`Amount ${absoluteAmount} exceeds maximum ${maxAmount}, capping to maximum`);
    return maxAmount;
  }
  
  return absoluteAmount;
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