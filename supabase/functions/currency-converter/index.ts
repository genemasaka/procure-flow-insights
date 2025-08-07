import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

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
    const { fromCurrency, toCurrency, amount } = await req.json();
    
    // Fetch real-time exchange rates
    const exchangeResponse = await fetch(`https://api.exchangerate.host/latest?base=${fromCurrency}&symbols=${toCurrency}`);
    const exchangeData = await exchangeResponse.json();
    
    if (!exchangeData.success || !exchangeData.rates[toCurrency]) {
      throw new Error('Failed to fetch exchange rates');
    }
    
    const rate = exchangeData.rates[toCurrency];
    const convertedAmount = amount * rate;
    
    // Get AI insights about currency trends (optional enhancement)
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    let aiInsights = null;
    
    if (GEMINI_API_KEY) {
      try {
        const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Provide a brief market insight about the ${fromCurrency} to ${toCurrency} exchange rate. Current rate: 1 ${fromCurrency} = ${rate} ${toCurrency}. Keep it under 100 words and focus on recent trends and factors affecting this currency pair.`
              }]
            }]
          }),
        });
        
        const aiData = await aiResponse.json();
        if (aiData.candidates && aiData.candidates[0]) {
          aiInsights = aiData.candidates[0].content.parts[0].text;
        }
      } catch (error) {
        console.log('AI insights not available:', error);
      }
    }
    
    return new Response(JSON.stringify({
      fromCurrency,
      toCurrency,
      originalAmount: amount,
      convertedAmount,
      exchangeRate: rate,
      timestamp: new Date().toISOString(),
      aiInsights
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Error in currency converter:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});