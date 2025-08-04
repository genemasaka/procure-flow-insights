import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ExtractionResult {
  contractData: {
    title: string | null;
    counterparty: string | null;
    contract_type: string | null;
    status: string;
    contract_value: number | null;
    currency: string | null;
    effective_date: string | null;
    expiration_date: string | null;
    renewal_notice_days: number | null;
    contract_content: string;
  };
  confidence: {
    title: number;
    counterparty: number;
    contract_type: number;
    contract_value: number;
    currency: number;
    effective_date: number;
    expiration_date: number;
    renewal_notice_days: number;
  };
  missingFields: string[];
  warnings: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { fileName, fileContent, existingData = {} } = await req.json()

    if (!fileContent) {
      throw new Error('File content is required')
    }

    console.log('Processing contract extraction for:', fileName)

    // Get Gemini API key
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not found in environment variables')
    }

    const extractionPrompt = `You are an expert contract analysis AI specializing in extracting structured information from legal documents. 

Analyze the following contract document and extract key information. Return your response as a valid JSON object with the following structure:

{
  "contractData": {
    "title": "Contract title or agreement name",
    "counterparty": "The other party (exclude our organization)",
    "contract_type": "One of: Employment, Service Agreement, NDA, Purchase Agreement, Lease, Partnership, Consulting, Software License, Vendor Agreement, Other",
    "status": "One of: Active, Pending, Expired, Terminated",
    "contract_value": "Numeric value only (no currency symbols)",
    "currency": "Three-letter currency code (USD, EUR, KES, etc.)",
    "effective_date": "YYYY-MM-DD format",
    "expiration_date": "YYYY-MM-DD format", 
    "renewal_notice_days": "Number of days for renewal notice",
    "contract_content": "Full contract text"
  },
  "confidence": {
    "title": 0.95,
    "counterparty": 0.90,
    "contract_type": 0.85,
    "contract_value": 0.80,
    "currency": 0.85,
    "effective_date": 0.90,
    "expiration_date": 0.88,
    "renewal_notice_days": 0.75
  },
  "missingFields": ["List of fields that couldn't be extracted"],
  "warnings": ["Any concerns or uncertainties about the extraction"]
}

Contract Type Guidelines:
- Employment: Employment agreements, job contracts, offer letters
- Service Agreement: Professional services, consulting services, maintenance agreements
- NDA: Non-disclosure agreements, confidentiality agreements
- Purchase Agreement: Purchase orders, procurement contracts, supplier agreements
- Lease: Property leases, equipment leases, rental agreements
- Partnership: Joint ventures, business partnerships, collaboration agreements
- Consulting: Consulting services, advisory agreements
- Software License: Software licensing, SaaS agreements
- Vendor Agreement: Supplier contracts, vendor services
- Other: Any contract not fitting the above categories

Extraction Guidelines:
1. CONTRACT TITLE: Look for main headings, document titles, or phrases like "Agreement", "Contract", etc.
2. COUNTERPARTY: Extract company names, individual names (avoid our organization name)
3. CONTRACT TYPE: Classify based on the nature of the agreement
4. STATUS: Determine based on dates and current status
5. CONTRACT VALUE: Look for monetary amounts, total values, payment terms
6. CURRENCY: Identify currency from symbols ($, €, KES) or written forms
7. EFFECTIVE DATE: Start date, commencement date, effective from
8. EXPIRATION DATE: End date, termination date, expiry
9. RENEWAL NOTICE: Notice period requirements, renewal terms

Date Format Patterns to Look For:
- MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD
- Written dates: "January 1, 2024", "1st January 2024"
- Relative dates: "30 days from signing"

Currency Patterns:
- $1,000.00, USD 1000, 1000 dollars
- €500, EUR 500, 500 euros  
- KES 50,000, 50,000 Kenyan Shillings

Value Patterns:
- "Total contract value of...", "Amount shall be...", "Payment of..."
- "Annual salary of...", "Monthly fee of...", "One-time payment of..."

Confidence Scoring (0.0 to 1.0):
- 0.9-1.0: Clearly stated in document
- 0.7-0.8: Inferred from context with high confidence
- 0.5-0.6: Reasonable guess based on available information
- 0.3-0.4: Low confidence, might need review
- 0.0-0.2: Not found or very uncertain

Document to analyze:
Title: ${fileName}
Content: ${fileContent}

Return only the JSON response, no additional text.`

    console.log('Calling Gemini API for contract extraction')

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: extractionPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.1, // Very low temperature for consistent extraction
          topK: 20,
          topP: 0.8,
          maxOutputTokens: 4096,
        },
      }),
    })

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text()
      console.error('Gemini API error:', geminiResponse.status, errorText)
      throw new Error(`Gemini API error: ${geminiResponse.status}`)
    }

    const geminiData = await geminiResponse.json()
    const aiResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || ""
    
    console.log('Raw AI response length:', aiResponse.length)

    // Parse the JSON response
    let extractedData: ExtractionResult
    try {
      // Clean the response to extract JSON
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response')
      }
      
      extractedData = JSON.parse(jsonMatch[0])
      console.log('Successfully parsed extraction results')
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
      console.error('Raw response:', aiResponse)
      
      // Fallback extraction result
      extractedData = {
        contractData: {
          title: fileName ? fileName.replace(/\.[^/.]+$/, "") : null,
          counterparty: null,
          contract_type: "Other",
          status: "Active",
          contract_value: null,
          currency: "USD",
          effective_date: null,
          expiration_date: null,
          renewal_notice_days: 30,
          contract_content: fileContent
        },
        confidence: {
          title: fileName ? 0.7 : 0.1,
          counterparty: 0.1,
          contract_type: 0.1,
          contract_value: 0.1,
          currency: 0.1,
          effective_date: 0.1,
          expiration_date: 0.1,
          renewal_notice_days: 0.1
        },
        missingFields: ["counterparty", "contract_value", "effective_date", "expiration_date"],
        warnings: ["AI extraction failed, using fallback values"]
      }
    }

    // Validate and enhance the extracted data
    const result = validateAndEnhanceExtraction(extractedData, fileName, fileContent)
    
    console.log('Contract extraction completed successfully')

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )

  } catch (error) {
    console.error('Error in contract-extractor function:', error)
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

function validateAndEnhanceExtraction(data: ExtractionResult, fileName: string, fileContent: string): ExtractionResult {
  const warnings: string[] = [...(data.warnings || [])]
  const missingFields: string[] = []

  // Validate and set defaults
  const contractData = { ...data.contractData }
  const confidence = { ...data.confidence }

  // Ensure contract_content is set
  if (!contractData.contract_content || contractData.contract_content.trim().length === 0) {
    contractData.contract_content = fileContent
    confidence.contract_content = 1.0
  }

  // Title fallback
  if (!contractData.title || contractData.title.trim().length === 0) {
    contractData.title = fileName ? fileName.replace(/\.[^/.]+$/, "") : "Untitled Contract"
    confidence.title = fileName ? 0.6 : 0.1
    if (!fileName) missingFields.push("title")
  }

  // Status validation
  const validStatuses = ["Active", "Pending", "Expired", "Terminated"]
  if (!validStatuses.includes(contractData.status)) {
    contractData.status = "Active"
    confidence.status = 0.1
  }

  // Contract type validation
  const validTypes = ["Employment", "Service Agreement", "NDA", "Purchase Agreement", "Lease", "Partnership", "Consulting", "Software License", "Vendor Agreement", "Other"]
  if (!validTypes.includes(contractData.contract_type || "")) {
    contractData.contract_type = "Other"
    confidence.contract_type = 0.1
  }

  // Currency validation and default
  if (!contractData.currency) {
    contractData.currency = "USD"
    confidence.currency = 0.1
  }

  // Date validation
  if (contractData.effective_date && contractData.expiration_date) {
    const effectiveDate = new Date(contractData.effective_date)
    const expirationDate = new Date(contractData.expiration_date)
    if (effectiveDate >= expirationDate) {
      warnings.push("Effective date is after expiration date - please review")
    }
  }

  // Renewal notice default
  if (!contractData.renewal_notice_days) {
    contractData.renewal_notice_days = 30
    confidence.renewal_notice_days = 0.1
  }

  // Check for missing critical fields
  if (!contractData.counterparty) missingFields.push("counterparty")
  if (!contractData.effective_date) missingFields.push("effective_date") 
  if (!contractData.expiration_date) missingFields.push("expiration_date")

  return {
    contractData,
    confidence,
    missingFields,
    warnings
  }
}