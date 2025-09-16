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
    
    const { csvContent, batchSize = 50, defaultChannel } = requestBody;
    
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

    // Parse CSV structure (robust - handles quotes, commas, CRLF, delimiters)
    const normalizeNewlines = (s: string) => s.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const raw = normalizeNewlines(csvContent).trim();
    const lines = raw.split('\n').filter((l) => l.length > 0);
    
    // CSV line splitter that respects quotes and various delimiters
    const splitCSVLine = (input: string) => {
      const out: string[] = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < input.length; i++) {
        const ch = input[i];
        if (ch === '"') {
          if (inQuotes && input[i + 1] === '"') { cur += '"'; i++; continue; }
          inQuotes = !inQuotes; 
          continue;
        }
        if (!inQuotes && (ch === ',' || ch === ';' || ch === '\t' || ch === '|')) {
          out.push(cur.trim());
          cur = '';
          continue;
        }
        cur += ch;
      }
      out.push(cur.trim());
      return out.map((cell) => cell.replace(/^"|"$/g, ''));
    };

    if (lines.length < 2) {
      throw new Error('CSV must have at least a header row and one data row');
    }

    const headers = splitCSVLine(lines[0]).map(h => h.trim().replace(/"/g, ''));
    const sampleRows = lines.slice(1, 4).map(line => 
      splitCSVLine(line)
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
       return await processLargeFileDirectly(lines, supabase, defaultChannel);
     }
 
     // Initialize Supabase client for smaller files too
     const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
     const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
     const supabase = createClient(supabaseUrl, supabaseKey);



    const analysisPrompt = `Analyze this CSV for ad spend data. Return ONLY valid JSON.

Headers: ${headers.join(', ')}
Sample rows: ${JSON.stringify(sampleRows)}

IMPORTANT: Look for columns that contain ACTUAL DATES (like "8/27/2025", "2025-08-27", etc.), not campaign names or date ranges. The date column should contain individual dates for each row, not campaign names like "Campaign #1".

Common date column names: "Day", "Date", "Period", "Time"
Common campaign column names: "Campaign", "Campaign name", "Ad group"
Common amount column names: "Cost", "Spend", "Amount", "Budget"

Return column indices (0-based) for mapping:
{
  "mapping": {
    "date": [index of column with actual dates],
    "channel": [index of channel/platform column], 
    "amount": [index of cost/spend column],
    "campaign_name": [index of campaign name column],
    "clicks": [index of clicks column or null],
    "ctr": [index of CTR column or null],
    "conversions": [index of conversions column or null]
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
    return await processWithMapping(lines, analysisResult.mapping, supabase, defaultChannel);

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
async function processLargeFileDirectly(lines: string[], supabase: any, defaultChannel?: string) {
  try {
    const splitCSVLine = (input: string) => {
      const out: string[] = []; let cur = ''; let inQuotes = false;
      for (let i = 0; i < input.length; i++) {
        const ch = input[i];
        if (ch === '"') { if (inQuotes && input[i + 1] === '"') { cur += '"'; i++; continue; } inQuotes = !inQuotes; continue; }
        if (!inQuotes && (ch === ',' || ch === ';' || ch === '\t' || ch === '|')) { out.push(cur.trim()); cur = ''; continue; }
        cur += ch;
      }
      out.push(cur.trim());
      return out.map((c) => c.replace(/^"|"$/g, ''));
    };
    const headers = splitCSVLine(lines[0]).map(h => h.trim().replace(/"/g, ''));
    const dataRows = lines.slice(1);
    
    // Use pattern matching for column detection
    const mapping = detectColumnsPattern(headers);
    console.log('Pattern-detected mapping:', mapping);
    
    return await processWithMapping(lines, mapping, supabase, defaultChannel);
  } catch (error) {
    throw new Error(`Large file processing failed: ${error.message}`);
  }
}

// Function to process data with given mapping
async function processWithMapping(lines: string[], mapping: any, supabase: any, defaultChannel?: string) {
  try {
    const splitCSVLine = (input: string) => {
      const out: string[] = []; let cur = ''; let inQuotes = false;
      for (let i = 0; i < input.length; i++) {
        const ch = input[i];
        if (ch === '"') { if (inQuotes && input[i + 1] === '"') { cur += '"'; i++; continue; } inQuotes = !inQuotes; continue; }
        if (!inQuotes && (ch === ',' || ch === ';' || ch === '\t' || ch === '|')) { out.push(cur.trim()); cur = ''; continue; }
        cur += ch;
      }
      out.push(cur.trim());
      return out.map((c) => c.replace(/^"|"$/g, ''));
    };
    const headers = splitCSVLine(lines[0]).map(h => h.trim().replace(/"/g, ''));
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
          const row = splitCSVLine(line);
          return processRow(row, mapping, i + index + 1, defaultChannel);
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
    conversions: null,
    impressions: null
  };

  console.log('Standardized header detection for:', headers);

  headers.forEach((header, index) => {
    const cleanHeader = header.toLowerCase().trim();
    
    // Exact matches for standardized headers
    if (cleanHeader === 'campaign' && mapping.campaign_name === null) {
      mapping.campaign_name = index;
    }
    else if (cleanHeader === 'day' && mapping.date === null) {
      mapping.date = index;
    }
    else if (cleanHeader === 'clicks' && mapping.clicks === null) {
      mapping.clicks = index;
    }
    else if (cleanHeader === 'cost' && mapping.amount === null) {
      mapping.amount = index;
    }
    else if (cleanHeader === 'ctr' && mapping.ctr === null) {
      mapping.ctr = index;
    }
    else if (cleanHeader === 'conversions' && mapping.conversions === null) {
      mapping.conversions = index;
    }
    // Fallback patterns for other variations
    else if (/date|time|period/.test(cleanHeader) && mapping.date === null) {
      mapping.date = index;
    }
    else if (/channel|platform|source|medium|network/.test(cleanHeader) && mapping.channel === null) {
      mapping.channel = index;
    }
    else if (/amount|spend|budget|price|value|total/.test(cleanHeader) && mapping.amount === null) {
      mapping.amount = index;
    }
    else if (/campaign|name|title|ad/.test(cleanHeader) && mapping.campaign_name === null) {
      mapping.campaign_name = index;
    }
    else if (/visit/.test(cleanHeader) && mapping.clicks === null) {
      mapping.clicks = index;
    }
    else if (/rate/.test(cleanHeader) && mapping.ctr === null) {
      mapping.ctr = index;
    }
    else if (/conversion|conv|action|quiz.*truenorth.*submitted|truenorth.*quiz.*submitted|leads/.test(cleanHeader) && mapping.conversions === null) {
      mapping.conversions = index;
    }
    else if (/impression|impressao|impressoes|impress/.test(cleanHeader) && mapping.impressions === null) {
      mapping.impressions = index;
    }
  });

  // Set default channel if not found (infer from campaign name)
  if (mapping.channel === null) {
    mapping.channel = 'google'; // Default to google for standardization
  }

  console.log('Final standardized mapping:', mapping);
  return mapping;
}

// Process a single row with mapping
function processRow(row: string[], mapping: any, rowIndex: number, defaultChannel?: string) {
  const getColumnValue = (field: string) => {
    const index = mapping[field];
    return index !== null && index !== undefined ? (row[index] || '') : '';
  };

  const dateStr = getColumnValue('date');
  const channelStr = getColumnValue('channel');
  const amountStr = getColumnValue('amount');
  const campaignName = getColumnValue('campaign_name') || `Campaign ${rowIndex}`;

  // Enhanced channel inference for multiple campaigns per day
  let finalChannel = 'google'; // Default
  
  if (channelStr && channelStr.trim()) {
    // Use explicit channel if provided
    finalChannel = channelStr.trim();
  } else {
    // Infer channel from campaign name for better multi-campaign support
    const lowerCampaign = campaignName.toLowerCase();
    if (lowerCampaign.includes('meta') || lowerCampaign.includes('facebook') || lowerCampaign.includes('fb')) {
      finalChannel = 'meta';
    } else if (lowerCampaign.includes('tiktok') || lowerCampaign.includes('tt')) {
      finalChannel = 'tiktok';
    } else if (lowerCampaign.includes('linkedin') || lowerCampaign.includes('li')) {
      finalChannel = 'linkedin';
    } else if (lowerCampaign.includes('google') || lowerCampaign.includes('ggl') || lowerCampaign.includes('search') || lowerCampaign.includes('performance')) {
      finalChannel = 'google';
    }
  }

  const processedRow = {
    date: standardizeDate(dateStr),
    channel: standardizeChannel(defaultChannel || finalChannel),
    amount: Math.round(parseAmount(amountStr) * 100), // Convert to cents
    campaign_name: campaignName,
    clicks: Math.min(parseInt(getColumnValue('clicks')) || 0, 1000000), // Cap clicks at 1M
    ctr: Math.min(Math.max(parseFloat(getColumnValue('ctr')) || 0, 0), 100), // Keep CTR as percentage, cap at 100%
    conversions: Math.min(parseInt(getColumnValue('conversions')) || 0, 100000), // Cap conversions at 100k
    impressions: Math.min(parseInt(getColumnValue('impressions')) || 0, 10000000) // Cap impressions at 10M
  };

  // Additional validation for amount overflow
  if (processedRow.amount > 10000000) { // More than $100,000 in cents
    console.warn(`Amount ${processedRow.amount} cents exceeds reasonable limit, capping to $100,000`);
    processedRow.amount = 10000000; // $100,000 in cents
  }

  // Validation - require valid date; allow zero amounts
  if (!processedRow.date || Number.isNaN(processedRow.amount) || processedRow.amount < 0) {
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
  if (!amountStr || amountStr.trim() === '') return 0;
  
  const trimmedAmount = amountStr.trim().toLowerCase();
  
  // Handle text representations of zero
  if (trimmedAmount === 'zero' || trimmedAmount === 'nil' || trimmedAmount === 'none' || trimmedAmount === '-') {
    return 0;
  }
  
  // Remove currency symbols and spaces, keep only numbers, dots, and minus signs
  const cleanAmount = amountStr.replace(/[^0-9.-]/g, '');
  
  // Handle empty string after cleaning
  if (!cleanAmount || cleanAmount === '') return 0;
  
  const parsed = parseFloat(cleanAmount);
  
  // If parsing fails, return 0 (this ensures zero values are preserved)
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

// Helper function to standardize dates with UTC construction to prevent timezone issues
function standardizeDate(dateStr: string, detectedFormat?: string): string {
  if (!dateStr) return getTodayUTC();
  
  console.log(`Parsing date input: "${dateStr}"`);
  
  try {
    dateStr = dateStr.trim().replace(/"/g, '');
    
    // Handle MM/DD/YYYY format
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        let year = parseInt(parts[2]);
        let month = parseInt(parts[0]);
        let day = parseInt(parts[1]);
        
        // Handle 2-digit years
        if (year < 100) {
          year += year < 30 ? 2000 : 1900;
        }
        
        // Check if format might be DD/MM/YYYY by checking if day > 12
        if (month > 12) {
          console.log(`Detected DD/MM/YYYY format, swapping month ${month} and day ${day}`);
          [month, day] = [day, month];
        }
        
        // Validate the date components
        if (isValidDateComponents(year, month, day)) {
          const result = createUTCDateString(year, month, day);
          console.log(`Successfully parsed "${dateStr}" -> "${result}"`);
          return result;
        } else {
          console.warn(`Invalid date components: year=${year}, month=${month}, day=${day}`);
        }
      }
    }
    
    // Handle YYYY-MM-DD format (ISO)
    if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        // Try YYYY-MM-DD first (ISO format)
        if (parts[0].length === 4) {
          const year = parseInt(parts[0]);
          const month = parseInt(parts[1]);
          const day = parseInt(parts[2]);
          
          if (isValidDateComponents(year, month, day)) {
            const result = createUTCDateString(year, month, day);
            console.log(`Successfully parsed ISO date "${dateStr}" -> "${result}"`);
            return result;
          }
        }
      }
    }
    
    // Try standard JS Date parsing as fallback (but convert to UTC)
    const date = new Date(dateStr);
    if (!isNaN(date.getTime()) && date.getFullYear() >= 1900 && date.getFullYear() <= 2100) {
      const result = createUTCDateString(date.getFullYear(), date.getMonth() + 1, date.getDate());
      console.log(`Fallback parsing "${dateStr}" -> "${result}"`);
      return result;
    }
    
    // If all parsing fails, return today's date
    console.warn(`Could not parse date: "${dateStr}", using today's date`);
    return getTodayUTC();
  } catch (error) {
    console.warn('Date parsing error:', error);
    return getTodayUTC();
  }
}

// Helper function to validate date components
function isValidDateComponents(year: number, month: number, day: number): boolean {
  if (year < 1900 || year > 2100) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  
  // Create a test date to ensure the date is actually valid (e.g., not Feb 30)
  const testDate = new Date(Date.UTC(year, month - 1, day));
  return testDate.getUTCFullYear() === year && 
         testDate.getUTCMonth() === month - 1 && 
         testDate.getUTCDate() === day;
}

// Helper function to create UTC date string without timezone conversion
function createUTCDateString(year: number, month: number, day: number): string {
  // Validate inputs one more time
  if (!isValidDateComponents(year, month, day)) {
    console.warn(`Invalid date components in createUTCDateString: ${year}-${month}-${day}`);
    return getTodayUTC();
  }
  
  // Create UTC date to avoid timezone issues
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  
  // Manual string construction to ensure exact format
  const yearStr = year.toString().padStart(4, '0');
  const monthStr = month.toString().padStart(2, '0');
  const dayStr = day.toString().padStart(2, '0');
  
  const result = `${yearStr}-${monthStr}-${dayStr}`;
  
  // Verify the constructed date matches our input
  if (utcDate.getUTCFullYear() !== year || utcDate.getUTCMonth() !== month - 1 || utcDate.getUTCDate() !== day) {
    console.warn(`Date construction mismatch: input ${year}-${month}-${day}, UTC date ${utcDate.getUTCFullYear()}-${utcDate.getUTCMonth() + 1}-${utcDate.getUTCDate()}`);
    return getTodayUTC();
  }
  
  return result;
}

// Helper function to get today's date in UTC format
function getTodayUTC(): string {
  const now = new Date();
  return createUTCDateString(now.getUTCFullYear(), now.getUTCMonth() + 1, now.getUTCDate());
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