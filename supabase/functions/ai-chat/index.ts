
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

    if (!message) {
      throw new Error('Message is required')
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get Gemini API key
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not found in environment variables')
    }

    // Get context from contracts and related data
    const { data: contracts, error: contractsError } = await supabase
      .from('contracts')
      .select(`
        *,
        deadlines(*),
        ai_insights(*)
      `)
      .limit(5)

    if (contractsError) {
      console.error('Error fetching contracts:', contractsError)
    }

    // Prepare context with contract content
    let contextInfo = "Here's information about the current contracts:\n\n"
    
    if (contracts && contracts.length > 0) {
      contracts.forEach((contract, index) => {
        contextInfo += `Contract ${index + 1}:\n`
        contextInfo += `- Title: ${contract.title || 'N/A'}\n`
        contextInfo += `- Counterparty: ${contract.counterparty || 'N/A'}\n`
        contextInfo += `- Type: ${contract.contract_type || 'N/A'}\n`
        contextInfo += `- Status: ${contract.status || 'N/A'}\n`
        contextInfo += `- Value: ${contract.contract_value || 'N/A'} ${contract.currency || 'USD'}\n`
        contextInfo += `- Effective Date: ${contract.effective_date || 'N/A'}\n`
        contextInfo += `- Expiration Date: ${contract.expiration_date || 'N/A'}\n`
        contextInfo += `- Renewal Notice: ${contract.renewal_notice_days || 30} days\n`
        
        if (contract.contract_content) {
          // Include more contract content for better AI analysis
          const contentPreview = contract.contract_content.length > 1000 
            ? contract.contract_content.substring(0, 1000) + '...' 
            : contract.contract_content
          contextInfo += `- Contract Content: ${contentPreview}\n`
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

    // Determine if this is a contract analysis request
    const isContractAnalysis = message.toLowerCase().includes('analyze') || 
                              message.toLowerCase().includes('extract') ||
                              message.toLowerCase().includes('contract') ||
                              userId === 'document-processor'

    let systemPrompt = `You are a contract management AI assistant. You help users manage their contracts, analyze risks, track deadlines, and provide insights.

${contextInfo}

User message: ${message}`

    // Special handling for contract document processing
    if (userId === 'document-processor') {
      systemPrompt = `You are an expert contract analysis AI. Your task is to extract key contract information from the provided document content.

Please analyze the following contract document and extract the required information. Focus on identifying:

1. Contract Title: The main title or heading of the contract
2. Counterparty: The other party/parties involved (companies, individuals)
3. Contract Type: Classify as one of the predefined types
4. Status: Determine if active, pending, expired, or terminated
5. Contract Content: The full text content
6. Contract Value: Any monetary amounts mentioned
7. Currency: Including Kenyan Shilling (KES) if mentioned
8. Effective Date: When the contract starts
9. Expiration Date: When the contract ends
10. Renewal Notice: Number of days notice required

${message}

Please provide accurate extraction based on the actual document content. If information is not clearly available, indicate this appropriately.`
    }

    console.log('Calling Gemini API with prompt length:', systemPrompt.length)

    // Call Gemini API
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: systemPrompt
          }]
        }],
        generationConfig: {
          temperature: isContractAnalysis ? 0.3 : 0.7, // Lower temperature for contract analysis
          topK: 40,
          topP: 0.95,
          maxOutputTokens: isContractAnalysis ? 2048 : 1024, // More tokens for contract analysis
        },
      }),
    })

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text()
      console.error('Gemini API error:', geminiResponse.status, errorText)
      throw new Error(`Gemini API error: ${geminiResponse.status} - ${errorText}`)
    }

    const geminiData = await geminiResponse.json()
    console.log('Gemini response received:', geminiData.candidates?.length || 0, 'candidates')
    
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
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
        details: 'Please check the function logs for more information'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
