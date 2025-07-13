import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CompetitorResult {
  title: string;
  url: string;
  description: string;
  position: number;
}

interface ContentBrief {
  keyword: string;
  targetAudience: string;
  userIntent: string;
  suggestedH1: string;
  h2Headings: string[];
  keyAngles: string[];
  contentGaps: string[];
  wordCount: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { keyword, competitors } = await req.json();
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

    if (!geminiApiKey) {
      console.error('Missing Gemini API key');
      return new Response(
        JSON.stringify({ error: 'Gemini API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const brief = await generateContentBrief(keyword, competitors, geminiApiKey);

    return new Response(
      JSON.stringify({ brief }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-content-brief function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function generateContentBrief(keyword: string, competitors: CompetitorResult[], apiKey: string): Promise<ContentBrief> {
  console.log('Generating content brief for:', keyword);

  const competitorAnalysis = competitors.map(comp => 
    `Position ${comp.position}: ${comp.title}\nDescription: ${comp.description}\nURL: ${comp.url}`
  ).join('\n\n');

  const prompt = `You are an expert SEO content strategist. Analyze the following keyword and competitor data to create a comprehensive content brief.

TARGET KEYWORD: "${keyword}"

TOP 10 COMPETITOR ANALYSIS:
${competitorAnalysis}

Based on this analysis, create a detailed content brief that includes:

1. Target Audience (who is searching for this?)
2. User Intent (what do they want to accomplish?)
3. Suggested H1 (compelling and keyword-optimized)
4. H2 Headings Structure (6-8 strategic subheadings)
5. Key Angles to Cover (unique perspectives to differentiate from competitors)
6. Content Gaps (what are competitors missing that we can capitalize on?)
7. Recommended Word Count (based on competitor analysis)

Return your response as a JSON object with this exact structure:
{
  "keyword": "${keyword}",
  "targetAudience": "string",
  "userIntent": "string", 
  "suggestedH1": "string",
  "h2Headings": ["string1", "string2", ...],
  "keyAngles": ["string1", "string2", ...],
  "contentGaps": ["string1", "string2", ...],
  "wordCount": number
}

Focus on creating content that will outrank the current top results by being more comprehensive, helpful, and unique.`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Gemini API error:', data);
      throw new Error(data.error?.message || 'Failed to generate content brief');
    }

    const generatedText = data.candidates[0]?.content?.parts[0]?.text;
    
    if (!generatedText) {
      throw new Error('No content generated from Gemini');
    }

    // Extract JSON from the response
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not extract JSON from Gemini response');
    }

    const brief = JSON.parse(jsonMatch[0]);
    
    // Validate the brief structure
    const requiredFields = ['keyword', 'targetAudience', 'userIntent', 'suggestedH1', 'h2Headings', 'keyAngles', 'contentGaps', 'wordCount'];
    for (const field of requiredFields) {
      if (!(field in brief)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    return brief;
  } catch (error) {
    console.error('Error generating content brief:', error);
    
    // Return a fallback brief
    return {
      keyword,
      targetAudience: "Business professionals and marketers interested in " + keyword,
      userIntent: "Learn about " + keyword + " and how to implement it effectively",
      suggestedH1: `The Complete Guide to ${keyword}: Everything You Need to Know`,
      h2Headings: [
        `What is ${keyword}?`,
        `Benefits of ${keyword}`,
        `How to Get Started with ${keyword}`,
        `Best Practices for ${keyword}`,
        `Common Challenges and Solutions`,
        `Tools and Resources`,
        `Case Studies and Examples`,
        `Future Trends and Conclusion`
      ],
      keyAngles: [
        "Beginner-friendly approach",
        "Practical implementation steps",
        "Real-world examples",
        "Expert insights"
      ],
      contentGaps: [
        "Comprehensive beginner guide",
        "Step-by-step implementation",
        "Common pitfalls to avoid",
        "Tool recommendations"
      ],
      wordCount: 2500
    };
  }
}