import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const { message, chatHistory = [] } = await req.json();
    
    if (!message) {
      throw new Error('Message is required');
    }

    console.log('Processing chat message:', message);

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Fetch all active Q&A items
    const { data: qaItems, error: qaError } = await supabase
      .from('chat_widget_qa')
      .select('*')
      .eq('is_active', true)
      .order('order_index');

    if (qaError) {
      console.error('Error fetching Q&A items:', qaError);
      throw new Error('Failed to fetch Q&A data');
    }

    console.log(`Found ${qaItems?.length || 0} Q&A items`);

    // Prepare context for Gemini
    const qaContext = qaItems?.map(item => ({
      question: item.question,
      answer: item.answer,
      links: item.related_links || []
    })) || [];

    // Create prompt for Gemini
    const systemPrompt = `You are a helpful customer support assistant for True North Business Loan, a Canadian business financing company. 

Your role is to:
1. Analyze the user's message and understand their intent
2. Find the most relevant answer from the provided Q&A database
3. Provide helpful, professional responses that guide users to the right information
4. If no exact match exists, provide a helpful response based on the context of business financing

IMPORTANT LINK GUIDELINES:
- Only use these existing website URLs: /, /loan-estimator, /how-it-works, /about, /equipment-financing, /small-business-loans, /merchant-cash-advance, /invoice-factoring, /privacy, /blog, /partners
- If you need to reference a page that doesn't exist, direct users to the home page (/) or ask them to leave their contact information
- For contact requests, ask for: Name (required), Email (required), Phone (optional), and a brief message about their needs

CONTACT FORM INSTRUCTIONS:
When users ask for personal contact, pricing details not in Q&A, or custom assistance, respond with:
"I'd be happy to have one of our specialists contact you personally. Please provide your contact information and I'll make sure someone reaches out to you soon. I'll need your name, email address, and optionally your phone number along with a brief description of your financing needs."

Available Q&A items:
${qaContext.map((item, index) => `${index + 1}. Q: ${item.question}\nA: ${item.answer}\nLinks: ${JSON.stringify(item.links)}`).join('\n\n')}

Guidelines:
- Be friendly, professional, and helpful
- If you find a relevant Q&A match, use that answer but feel free to personalize it
- Only include valid existing links from the list above
- If no direct match, provide helpful guidance related to business financing
- Keep responses concise but informative
- Always maintain a supportive tone for potential business loan applicants
- For complex requests or specific details not in Q&A, offer to collect contact information`;

    const userPrompt = `User message: "${message}"

Previous conversation context:
${chatHistory.map((msg: any) => `${msg.type}: ${msg.content}`).join('\n')}

Please provide a helpful response. If you reference any links from the Q&A database, format them as JSON in this format at the end: {"links": [{"title": "Link Title", "url": "/path"}]}`;

    // Call Gemini API
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: systemPrompt },
              { text: userPrompt }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    console.log('Gemini response:', geminiData);

    const aiResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!aiResponse) {
      throw new Error('No response from Gemini');
    }

    // Extract links if they exist in the response
    let responseText = aiResponse;
    let links: any[] = [];
    
    try {
      // Look for JSON links at the end of the response
      const linkMatch = responseText.match(/\{"links":\s*\[.*?\]\}/);
      if (linkMatch) {
        const linkData = JSON.parse(linkMatch[0]);
        links = linkData.links || [];
        responseText = responseText.replace(linkMatch[0], '').trim();
      }
    } catch (e) {
      console.log('No links found in response');
    }

    const result = {
      response: responseText,
      links: links,
      timestamp: new Date().toISOString()
    };

    console.log('Final response:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in chat-with-ai function:', error);
    
    // Fallback response
    const fallbackResponse = {
      response: "I'm sorry, I'm having trouble processing your request right now. Please contact our support team directly for assistance with your business financing needs.",
      links: [{ title: "Contact Us", url: "/contact" }],
      timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(fallbackResponse), {
      status: 200, // Return 200 to avoid frontend errors
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});