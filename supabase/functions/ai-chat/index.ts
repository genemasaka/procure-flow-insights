
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, userId } = await req.json();
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Gather context from user's data
    const [contractsResult, insightsResult, deadlinesResult] = await Promise.all([
      supabase.from('contracts').select('*').limit(20),
      supabase.from('ai_insights').select('*, contracts(title, counterparty)').limit(10),
      supabase.from('deadlines').select('*, contracts(title, counterparty)').limit(10)
    ]);

    const contracts = contractsResult.data || [];
    const insights = insightsResult.data || [];
    const deadlines = deadlinesResult.data || [];

    // Build context for the AI
    const contractContext = contracts.map(c => 
      `Contract: ${c.title} with ${c.counterparty}, Type: ${c.contract_type}, Status: ${c.status}, Value: ${c.contract_value} ${c.currency || 'USD'}`
    ).join('\n');

    const insightContext = insights.map(i => 
      `Insight: ${i.title} - ${i.description} (Impact: ${i.impact}, Confidence: ${i.confidence}%)`
    ).join('\n');

    const deadlineContext = deadlines.map(d => 
      `Deadline: ${d.title} - ${d.description || ''} Due: ${d.due_date} Priority: ${d.priority} Status: ${d.status}`
    ).join('\n');

    const systemPrompt = `You are an AI assistant for ProcureFlow, a contract management system. Help users with questions about their contracts, insights, and deadlines.

Current user's data context:
CONTRACTS:
${contractContext}

AI INSIGHTS:
${insightContext}

DEADLINES:
${deadlineContext}

Provide helpful, accurate responses based on this context. If asked about specific contracts or data not in the context, let the user know you can only see their current data shown above.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'OpenAI API error');
    }

    const aiResponse = data.choices[0].message.content;

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-chat function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
