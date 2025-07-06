
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, userId } = await req.json()

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get context from contracts and related data
    const { data: contracts } = await supabase
      .from('contracts')
      .select(`
        *,
        deadlines(*),
        ai_insights(*)
      `)
      .limit(5)

    // Get Gemini API key
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not found in environment variables')
    }

    // Prepare context with contract content
    let contextInfo = "Here's information about the current contracts:\n\n"
    
    if (contracts && contracts.length > 0) {
      contracts.forEach((contract, index) => {
        contextInfo += `Contract ${index + 1}:\n`
        contextInfo += `- Title: ${contract.title}\n`
        contextInfo += `- Counterparty: ${contract.counterparty}\n`
        contextInfo += `- Type: ${contract.contract_type}\n`
        contextInfo += `- Status: ${contract.status}\n`
        contextInfo += `- Value: ${contract.contract_value} ${contract.currency}\n`
        contextInfo += `- Effective Date: ${contract.effective_date || 'N/A'}\n`
        contextInfo += `- Expiration Date: ${contract.expiration_date || 'N/A'}\n`
        
        if (contract.contract_content) {
          contextInfo += `- Contract Content: ${contract.contract_content.substring(0, 500)}${contract.contract_content.length > 500 ? '...' : ''}\n`
        }
        
        if (contract.deadlines && contract.deadlines.length > 0) {
          contextInfo += `- Upcoming Deadlines: ${contract.deadlines.map(d => `${d.title} (${d.due_date})`).join(', ')}\n`
        }
        
        if (contract.ai_insights && contract.ai_insights.length > 0) {
          contextInfo += `- AI Insights: ${contract.ai_insights.map(i => `${i.title} (${i.impact} impact)`).join(', ')}\n`
        }
        
        contextInfo += '\n'
      })
    } else {
      contextInfo += "No contracts available in the system yet.\n\n"
    }

    // Call Gemini API
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are a contract management AI assistant. You help users manage their contracts, analyze risks, track deadlines, and provide insights.

${contextInfo}

User message: ${message}

Please provide a helpful response based on the contract information available. If the user asks about specific contracts, reference the contract content when available. Focus on being practical and actionable in your advice.`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      }),
    })

    if (!geminiResponse.ok) {
      throw new Error(`Gemini API error: ${geminiResponse.status}`)
    }

    const geminiData = await geminiResponse.json()
    const aiResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "I apologize, but I couldn't generate a response at this time."

    return new Response(
      JSON.stringify({ response: aiResponse }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )

  } catch (error) {
    console.error('Error in ai-chat function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
