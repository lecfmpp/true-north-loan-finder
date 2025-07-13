import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface KeywordOpportunity {
  keyword: string;
  intent: string;
  competition: 'low' | 'medium' | 'high';
  searchVolume?: number;
  difficulty?: number;
}

interface CompetitorResult {
  title: string;
  url: string;
  description: string;
  position: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, type } = await req.json();
    const dataforSeoAuth = Deno.env.get('DATAFORSEO_AUTHORIZATION');

    if (!dataforSeoAuth) {
      console.error('Missing DataForSEO Authorization credentials');
      return new Response(
        JSON.stringify({ error: 'DataForSEO Authorization credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (type === 'keyword_discovery') {
      // Step 1: Topic Opportunity Discovery
      const keywords = await discoverKeywords(query, dataforSeoAuth);
      
      return new Response(
        JSON.stringify({ keywords }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (type === 'serp_analysis') {
      // Step 2: SERP Analysis
      const competitors = await analyzeSERP(query, dataforSeoAuth);
      
      return new Response(
        JSON.stringify({ competitors }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid request type' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in dataforseo-search function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function discoverKeywords(seedKeyword: string, authorization: string): Promise<KeywordOpportunity[]> {
  console.log('Discovering keywords for:', seedKeyword);
  
  try {
    // First, get related keywords from DataForSEO Keywords Data API
    const relatedKeywordsUrl = 'https://api.dataforseo.com/v3/keywords_data/google/search_volume/live';
    
    // Generate keyword variations for the request
    const keywordVariations = [
      seedKeyword,
      `${seedKeyword} guide`,
      `${seedKeyword} tutorial`,
      `${seedKeyword} tips`,
      `${seedKeyword} best practices`,
      `${seedKeyword} examples`,
      `${seedKeyword} tools`,
      `${seedKeyword} strategy`,
      `${seedKeyword} benefits`,
      `${seedKeyword} how to`,
      `what is ${seedKeyword}`,
      `${seedKeyword} for beginners`,
      `${seedKeyword} vs`,
      `${seedKeyword} case study`,
      `${seedKeyword} implementation`
    ];

    const response = await fetch(relatedKeywordsUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authorization}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([{
        location_name: "United States",
        language_name: "English",
        keywords: keywordVariations
      }]),
    });

    if (!response.ok) {
      throw new Error(`DataForSEO API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('DataForSEO Keywords response:', data);

    const keywords: KeywordOpportunity[] = [];

    if (data.tasks?.[0]?.result) {
      data.tasks[0].result.forEach((item: any) => {
        const searchVolume = item.search_volume || 0;
        const competition = item.competition || 0;
        
        // Determine competition level based on competition index
        let competitionLevel: 'low' | 'medium' | 'high' = 'medium';
        if (competition < 0.3) competitionLevel = 'low';
        else if (competition > 0.7) competitionLevel = 'high';

        // Determine intent based on keyword patterns
        let intent = 'informational';
        const keyword = item.keyword.toLowerCase();
        if (keyword.includes('buy') || keyword.includes('price') || keyword.includes('cost')) {
          intent = 'commercial';
        } else if (keyword.includes('how to') || keyword.includes('guide') || keyword.includes('tutorial')) {
          intent = 'informational';
        } else if (keyword.includes('best') || keyword.includes('vs') || keyword.includes('compare')) {
          intent = 'commercial';
        }

        keywords.push({
          keyword: item.keyword,
          intent,
          competition: competitionLevel,
          searchVolume: searchVolume,
          difficulty: Math.round(competition * 100)
        });
      });
    }

    // If no results from API, provide some basic variations
    if (keywords.length === 0) {
      const fallbackKeywords = [
        { keyword: seedKeyword, intent: 'informational', competition: 'medium' as const },
        { keyword: `${seedKeyword} guide`, intent: 'informational', competition: 'low' as const },
        { keyword: `${seedKeyword} tips`, intent: 'informational', competition: 'low' as const },
        { keyword: `how to ${seedKeyword}`, intent: 'informational', competition: 'medium' as const },
        { keyword: `${seedKeyword} best practices`, intent: 'informational', competition: 'medium' as const }
      ];
      keywords.push(...fallbackKeywords);
    }

    // Sort by search volume (descending) and return top 15
    return keywords
      .sort((a, b) => (b.searchVolume || 0) - (a.searchVolume || 0))
      .slice(0, 15);

  } catch (error) {
    console.error('Error discovering keywords:', error);
    // Return fallback keywords
    return [
      { keyword: seedKeyword, intent: 'informational', competition: 'medium' },
      { keyword: `${seedKeyword} guide`, intent: 'informational', competition: 'low' },
      { keyword: `${seedKeyword} tips`, intent: 'informational', competition: 'low' },
      { keyword: `how to ${seedKeyword}`, intent: 'informational', competition: 'medium' },
      { keyword: `${seedKeyword} best practices`, intent: 'informational', competition: 'medium' }
    ];
  }
}

async function analyzeSERP(keyword: string, authorization: string): Promise<CompetitorResult[]> {
  console.log('Analyzing SERP for:', keyword);
  
  try {
    // Use DataForSEO SERP API for real search results
    const serpUrl = 'https://api.dataforseo.com/v3/serp/google/organic/live/advanced';
    
    const response = await fetch(serpUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authorization}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([{
        location_name: "United States",
        language_name: "English",
        keyword: keyword,
        depth: 10
      }]),
    });

    if (!response.ok) {
      throw new Error(`DataForSEO SERP API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('DataForSEO SERP response:', data);

    const competitors: CompetitorResult[] = [];
    
    if (data.tasks?.[0]?.result?.[0]?.items) {
      data.tasks[0].result[0].items.forEach((item: any, index: number) => {
        if (item.type === 'organic') {
          competitors.push({
            title: item.title || '',
            url: item.url || '',
            description: item.description || '',
            position: item.rank_group || index + 1
          });
        }
      });
    }

    return competitors.slice(0, 10); // Return top 10 competitors
  } catch (error) {
    console.error('Error analyzing SERP:', error);
    // Return empty array on error
    return [];
  }
}