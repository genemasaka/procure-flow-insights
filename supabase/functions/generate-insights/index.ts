import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContractInsight {
  insight_type: 'risk' | 'opportunity' | 'anomaly' | 'trend';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  actionable: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contractId } = await req.json();

    if (!contractId) {
      throw new Error('Contract ID is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

    if (!supabaseUrl || !supabaseServiceKey || !geminiApiKey) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch contract data
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', contractId)
      .single();

    if (contractError || !contract) {
      throw new Error('Contract not found');
    }

    // Generate insights using Gemini
    const insights = await generateContractInsights(contract, geminiApiKey);

    // Store insights in database
    const insertPromises = insights.map(insight => 
      supabase
        .from('ai_insights')
        .insert({
          contract_id: contractId,
          insight_type: insight.insight_type,
          title: insight.title,
          description: insight.description,
          impact: insight.impact,
          confidence: insight.confidence,
          actionable: insight.actionable
        })
    );

    const results = await Promise.all(insertPromises);
    
    // Check for errors
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      console.error('Error inserting insights:', errors);
      throw new Error('Failed to store some insights');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        insights: insights.length,
        message: `Generated ${insights.length} insights for contract`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-insights function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function generateContractInsights(contract: any, geminiApiKey: string): Promise<ContractInsight[]> {
  const prompt = `Analyze this contract and provide specific, actionable insights. Focus on real business value, risks, and opportunities.

Contract Details:
- Title: ${contract.title}
- Counterparty: ${contract.counterparty}
- Type: ${contract.contract_type}
- Value: ${contract.contract_value ? `${contract.currency} ${contract.contract_value}` : 'Not specified'}
- Effective: ${contract.effective_date || 'Not specified'}
- Expires: ${contract.expiration_date || 'Not specified'}
- Renewal Notice: ${contract.renewal_notice_days || 'Not specified'} days
- Status: ${contract.status}

Contract Content:
${contract.contract_content ? contract.contract_content.substring(0, 3000) : 'No content available'}

Generate 3-5 specific insights covering:
1. RISKS: Payment terms, liability, termination clauses, compliance issues
2. OPPORTUNITIES: Cost optimization, renewal strategies, renegotiation points
3. ANOMALIES: Unusual terms, missing clauses, inconsistencies
4. TRENDS: Market comparisons, renewal timing, value assessment

For each insight, provide:
- insight_type: "risk", "opportunity", "anomaly", or "trend"
- title: Brief, specific title (max 60 chars)
- description: Detailed explanation with specific contract references
- impact: "high", "medium", or "low"
- confidence: 0-100 (confidence in the analysis)
- actionable: true/false (can user take immediate action?)

Return ONLY a valid JSON array of insights, no other text:`;

  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=' + geminiApiKey, {
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

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid response from Gemini API');
    }

    const generatedText = data.candidates[0].content.parts[0].text;
    
    // Clean up the response and parse JSON
    const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in Gemini response');
    }

    const insights = JSON.parse(jsonMatch[0]);
    
    // Validate insights structure
    return insights.filter((insight: any) => 
      insight.insight_type && 
      insight.title && 
      insight.description && 
      insight.impact && 
      typeof insight.confidence === 'number' &&
      typeof insight.actionable === 'boolean'
    );

  } catch (error) {
    console.error('Error generating insights with Gemini:', error);
    
    // Fallback insights based on contract data
    const fallbackInsights: ContractInsight[] = [];
    
    // Risk insight for missing expiration date
    if (!contract.expiration_date) {
      fallbackInsights.push({
        insight_type: 'risk',
        title: 'Missing Contract Expiration Date',
        description: 'This contract does not have a specified expiration date, which could lead to auto-renewal issues or difficulty tracking contract lifecycle.',
        impact: 'medium',
        confidence: 95,
        actionable: true
      });
    }

    // Risk insight for high value contracts without proper tracking
    if (contract.contract_value && contract.contract_value > 100000) {
      fallbackInsights.push({
        insight_type: 'risk',
        title: 'High-Value Contract Requires Enhanced Monitoring',
        description: `This ${contract.currency} ${contract.contract_value} contract represents significant financial exposure and should have dedicated oversight and milestone tracking.`,
        impact: 'high',
        confidence: 90,
        actionable: true
      });
    }

    // Opportunity insight for renewal timing
    if (contract.expiration_date) {
      const expirationDate = new Date(contract.expiration_date);
      const now = new Date();
      const daysUntilExpiration = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiration > 0 && daysUntilExpiration <= 90) {
        fallbackInsights.push({
          insight_type: 'opportunity',
          title: 'Contract Renewal Window Approaching',
          description: `Contract expires in ${daysUntilExpiration} days. This is an opportunity to renegotiate terms, pricing, or scope before renewal.`,
          impact: 'medium',
          confidence: 100,
          actionable: true
        });
      }
    }

    // Anomaly insight for short renewal notice
    if (contract.renewal_notice_days && contract.renewal_notice_days < 30) {
      fallbackInsights.push({
        insight_type: 'anomaly',
        title: 'Unusually Short Renewal Notice Period',
        description: `${contract.renewal_notice_days} days renewal notice is shorter than typical 30-60 day industry standard, which may limit negotiation flexibility.`,
        impact: 'medium',
        confidence: 85,
        actionable: true
      });
    }

    return fallbackInsights.length > 0 ? fallbackInsights : [{
      insight_type: 'trend',
      title: 'Contract Analysis Complete',
      description: 'Basic contract information has been processed. Consider adding more detailed contract terms for deeper analysis.',
      impact: 'low',
      confidence: 70,
      actionable: false
    }];
  }
}