import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

interface BlogPostData {
  title: string;
  content: string;
  excerpt: string;
  metaTitle: string;
  metaDescription: string;
  tags: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { brief } = await req.json();
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

    if (!geminiApiKey) {
      console.error('Missing Gemini API key');
      return new Response(
        JSON.stringify({ error: 'Gemini API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const post = await generateBlogPost(brief, geminiApiKey);

    return new Response(
      JSON.stringify({ post }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-blog-post function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function generateBlogPost(brief: ContentBrief, apiKey: string): Promise<BlogPostData> {
  console.log('Generating blog post for:', brief.keyword);

  const prompt = `You are an expert content writer and SEO specialist. Write a comprehensive, engaging, and SEO-optimized blog post based on the following content brief.

CONTENT BRIEF:
- Target Keyword: "${brief.keyword}"
- Target Audience: ${brief.targetAudience}
- User Intent: ${brief.userIntent}
- Suggested H1: ${brief.suggestedH1}
- Target Word Count: ${brief.wordCount} words

H2 HEADINGS STRUCTURE:
${brief.h2Headings.map((heading, index) => `${index + 1}. ${heading}`).join('\n')}

KEY ANGLES TO COVER:
${brief.keyAngles.map(angle => `- ${angle}`).join('\n')}

CONTENT GAPS TO FILL:
${brief.contentGaps.map(gap => `- ${gap}`).join('\n')}

INSTRUCTIONS:
1. Write a complete blog post that follows the H2 structure provided
2. Include the target keyword naturally throughout the content
3. Write in an engaging, authoritative tone
4. Include practical tips, examples, and actionable advice
5. Use HTML formatting (h1, h2, p, ul, li, strong, em tags)
6. Make sure the content is comprehensive and valuable
7. Include a compelling introduction and conclusion
8. Ensure the content addresses the user intent completely

Return your response as a JSON object with this exact structure:
{
  "title": "SEO-optimized title (60 characters or less)",
  "content": "Full HTML blog post content",
  "excerpt": "Brief summary (155 characters or less)",
  "metaTitle": "SEO meta title (60 characters or less)",
  "metaDescription": "SEO meta description (155 characters or less)",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}

Write high-quality, original content that provides real value to readers.`;

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
          maxOutputTokens: 4096,
        }
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Gemini API error:', data);
      throw new Error(data.error?.message || 'Failed to generate blog post');
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

    const post = JSON.parse(jsonMatch[0]);
    
    // Validate the post structure
    const requiredFields = ['title', 'content', 'excerpt', 'metaTitle', 'metaDescription', 'tags'];
    for (const field of requiredFields) {
      if (!(field in post)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    return post;
  } catch (error) {
    console.error('Error generating blog post:', error);
    
    // Return a fallback blog post
    const fallbackContent = `
      <h1>${brief.suggestedH1}</h1>
      <p>This comprehensive guide will help you understand ${brief.keyword} and how to implement it effectively for your business.</p>
      
      ${brief.h2Headings.map(heading => `
        <h2>${heading}</h2>
        <p>This section covers important aspects of ${heading.toLowerCase()}. Here you'll find detailed information and practical tips to help you succeed with ${brief.keyword}.</p>
        <ul>
          <li>Key point about ${heading.toLowerCase()}</li>
          <li>Important consideration for implementation</li>
          <li>Best practice recommendation</li>
        </ul>
      `).join('')}
      
      <h2>Conclusion</h2>
      <p>Understanding ${brief.keyword} is essential for modern businesses. By following the strategies outlined in this guide, you'll be well-equipped to implement ${brief.keyword} successfully.</p>
    `;

    return {
      title: brief.suggestedH1,
      content: fallbackContent,
      excerpt: `Learn everything you need to know about ${brief.keyword} in this comprehensive guide.`,
      metaTitle: brief.suggestedH1.substring(0, 60),
      metaDescription: `Discover how to implement ${brief.keyword} effectively with our expert guide. Get practical tips and strategies.`,
      tags: [brief.keyword, "guide", "tutorial", "tips", "strategy"]
    };
  }
}