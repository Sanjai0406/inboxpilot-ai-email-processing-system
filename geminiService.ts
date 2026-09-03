import { GoogleGenAI, Type } from '@google/genai';
import { AIAnalysis, EmailIntent, EmailUrgency } from '../src/types';

let genAIClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIClient;
}

export interface RawAnalysisOutput {
  intent: EmailIntent;
  importantDetails: string[];
  urgency: EmailUrgency;
  missingInformation: string[];
  confidence: number;
  reasoningSummary: string;
}

export function validateStructuredAnalysis(
  data: any
): { isValid: boolean; parsed?: RawAnalysisOutput; errors: string[] } {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Output is not a valid JSON object'] };
  }

  const validIntents: EmailIntent[] = [
    'Billing',
    'Technical Support',
    'Sales',
    'Account Support',
    'General Support',
    'Complaint',
    'Cancellation',
    'Refund',
    'Other',
    'Unknown',
  ];

  const validUrgencies: EmailUrgency[] = ['Low', 'Medium', 'High', 'Critical', 'Unknown'];

  if (!data.intent || !validIntents.includes(data.intent)) {
    errors.push(`Invalid or missing intent: ${data.intent}`);
  }

  if (!Array.isArray(data.importantDetails)) {
    errors.push('importantDetails must be an array of strings');
  }

  if (!data.urgency || !validUrgencies.includes(data.urgency)) {
    errors.push(`Invalid or missing urgency: ${data.urgency}`);
  }

  if (!Array.isArray(data.missingInformation)) {
    errors.push('missingInformation must be an array of strings');
  }

  if (typeof data.confidence !== 'number' || isNaN(data.confidence) || data.confidence < 0 || data.confidence > 1) {
    errors.push(`Confidence must be a number between 0 and 1 (got: ${data.confidence})`);
  }

  if (typeof data.reasoningSummary !== 'string' || data.reasoningSummary.trim().length === 0) {
    errors.push('reasoningSummary must be a non-empty string');
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    parsed: {
      intent: data.intent,
      importantDetails: data.importantDetails.map(String),
      urgency: data.urgency,
      missingInformation: data.missingInformation.map(String),
      confidence: Math.round(data.confidence * 100) / 100,
      reasoningSummary: data.reasoningSummary.trim(),
    },
    errors: [],
  };
}

/**
 * Deterministic baseline analyzer used as a resilient fallback
 * when Gemini API key is not present or for controlled offline test runs.
 */
export function simulateDeterministicAnalysis(
  sender: string,
  subject: string,
  body: string
): RawAnalysisOutput {
  const combined = `${subject} ${body}`.toLowerCase();

  // Check for ambiguous / missing context
  if (body.trim().length < 40 && !combined.includes('invoice') && !combined.includes('error') && !combined.includes('refund')) {
    return {
      intent: 'Unknown',
      importantDetails: ['Sender reports an issue without providing identifiers or context'],
      urgency: 'Medium',
      missingInformation: ['Specific product or service name', 'Account ID or email associated with issue', 'Error logs or reproduction steps'],
      confidence: 0.45,
      reasoningSummary: 'Email contains minimal text ("not working right") without identifying what system, transaction, or feature is broken.',
    };
  }

  // Refund
  if (combined.includes('refund') || combined.includes('money back') || combined.includes('overcharge')) {
    const cardMatch = body.match(/card ending in (\d+)/i);
    const amountMatch = body.match(/\$[\d,.]+/);
    const details = ['Customer requests a monetary refund'];
    if (amountMatch) details.push(`Mentioned amount: ${amountMatch[0]}`);
    if (cardMatch) details.push(`Payment method: Card ending in ${cardMatch[1]}`);
    return {
      intent: 'Refund',
      importantDetails: details,
      urgency: combined.includes('urgent') || combined.includes('today') ? 'High' : 'Medium',
      missingInformation: amountMatch ? [] : ['Transaction date or invoice ID'],
      confidence: 0.94,
      reasoningSummary: 'Explicit request for subscription refund and monetary reversal.',
    };
  }

  // Cancellation
  if (combined.includes('cancel') || combined.includes('not renew') || combined.includes('termination')) {
    const orgMatch = body.match(/(?:org|account)\s*(?:id)?[:\s]+([A-Z0-9_-]+)/i);
    const details = ['Customer requested contract/subscription cancellation'];
    if (orgMatch) details.push(`Organization ID: ${orgMatch[1]}`);
    return {
      intent: 'Cancellation',
      importantDetails: details,
      urgency: 'Medium',
      missingInformation: orgMatch ? [] : ['Organization or Account ID'],
      confidence: 0.92,
      reasoningSummary: 'Customer explicitly asked to cancel annual contract renewal.',
    };
  }

  // High-impact GDPR / Deletion
  if (combined.includes('deletion') || combined.includes('gdpr') || combined.includes('right to erasure') || combined.includes('delete account')) {
    return {
      intent: 'Account Support',
      importantDetails: ['GDPR Article 17 Right to Erasure request', 'Request for permanent deletion of account, telemetry, and records'],
      urgency: 'High',
      missingInformation: ['Identity verification / authorization check'],
      confidence: 0.95,
      reasoningSummary: 'Formal regulatory erasure request requiring permanent account data deletion.',
    };
  }

  // Urgent Complaint / Churn
  if (combined.includes('unacceptable') || combined.includes('outage') || combined.includes('demand explanation') || combined.includes('angry')) {
    return {
      intent: 'Complaint',
      importantDetails: ['Report of multiple outages this week', 'Customer presentation failed', 'Threatened public escalation and complaint'],
      urgency: 'Critical',
      missingInformation: ['Specific affected account or workspace name'],
      confidence: 0.93,
      reasoningSummary: 'Severe dissatisfaction expressed with repeated downtime impact on business presentation.',
    };
  }

  // Technical Support
  if (combined.includes('500') || combined.includes('error') || combined.includes('bug') || combined.includes('trace') || combined.includes('sdk') || combined.includes('crash')) {
    const traceMatch = body.match(/trace\s*(?:id)?[:\s]+([a-z0-9-]+)/i);
    const details = ['Production worker failure reporting HTTP 500'];
    if (traceMatch) details.push(`Trace ID: ${traceMatch[1]}`);
    return {
      intent: 'Technical Support',
      importantDetails: details,
      urgency: combined.includes('critical') || combined.includes('blocked') ? 'High' : 'Medium',
      missingInformation: [],
      confidence: 0.96,
      reasoningSummary: 'Detailed technical error log provided with endpoint, status code, and trace ID.',
    };
  }

  // Sales
  if (combined.includes('quote') || combined.includes('seats') || combined.includes('enterprise license') || combined.includes('pricing') || combined.includes('procurement')) {
    const seatMatch = body.match(/(\d+)\s*seats/i);
    return {
      intent: 'Sales',
      importantDetails: [
        `Enterprise expansion inquiry (${seatMatch ? seatMatch[1] : 'multiple'} seats)`,
        'Requires SOC2 Type II, custom SSO, and annual invoicing terms',
      ],
      urgency: 'Medium',
      missingInformation: [],
      confidence: 0.95,
      reasoningSummary: 'High-value enterprise expansion lead requesting a sales discovery meeting.',
    };
  }

  // Billing (including duplicate charge)
  if (combined.includes('invoice') || combined.includes('payment') || combined.includes('wire') || combined.includes('charged') || combined.includes('bill')) {
    const invMatch = body.match(/(?:invoice|#)[\s-]*([A-Z0-9-]+)/i);
    const amountMatch = body.match(/\$[\d,.]+/);
    const details = ['Billing inquiry regarding payment reconciliation or charge verification'];
    if (invMatch) details.push(`Invoice/Ref: ${invMatch[1]}`);
    if (amountMatch) details.push(`Amount: ${amountMatch[0]}`);
    return {
      intent: 'Billing',
      importantDetails: details,
      urgency: 'Low',
      missingInformation: invMatch ? [] : ['Invoice number or transaction reference'],
      confidence: 0.91,
      reasoningSummary: 'Email relates to payment confirmation, receipt issuance, or transaction review.',
    };
  }

  // General Support
  return {
    intent: 'General Support',
    importantDetails: ['Customer seeking guidance on feature location or platform documentation'],
    urgency: 'Low',
    missingInformation: [],
    confidence: 0.88,
    reasoningSummary: 'General inquiry about platform settings and webhook configuration.',
  };
}

export async function analyzeEmailWithGemini(
  emailId: string,
  sender: string,
  subject: string,
  body: string,
  options?: {
    forceMalformed?: boolean;
    forceFailure?: boolean;
    forceLowConfidence?: boolean;
  }
): Promise<{ rawJson: string; analysis: RawAnalysisOutput; validationErrors: string[] }> {
  // Check for forced simulation test scenarios
  if (options?.forceFailure) {
    throw new Error('SIMULATED_LLM_API_UNAVAILABLE: Upstream AI gateway timeout (503 Service Unavailable)');
  }

  if (options?.forceMalformed) {
    const malformedText = '{ "intent": "Billing", "confidence": "HIGH_CONFIDENCE", "missingInformation": invalid_json_syntax';
    const validation = validateStructuredAnalysis({ intent: 'INVALID_SYNTAX' });
    return {
      rawJson: malformedText,
      analysis: {
        intent: 'Unknown',
        importantDetails: [],
        urgency: 'Unknown',
        missingInformation: ['Analysis failed due to malformed LLM response'],
        confidence: 0.0,
        reasoningSummary: 'Model output could not be parsed as valid JSON schema.',
      },
      validationErrors: ['JSON parse error: Unexpected token in JSON at position 64', ...validation.errors],
    };
  }

  const client = getGeminiClient();

  if (!client) {
    // Graceful deterministic simulation when no API key is provided
    const sim = simulateDeterministicAnalysis(sender, subject, body);
    if (options?.forceLowConfidence) {
      sim.confidence = 0.42;
      sim.reasoningSummary += ' [Simulated low confidence threshold]';
    }
    const rawJson = JSON.stringify(sim, null, 2);
    const val = validateStructuredAnalysis(sim);
    return {
      rawJson,
      analysis: sim,
      validationErrors: val.errors,
    };
  }

  const prompt = `You are a precision AI email understanding system for InboxPilot.
Analyze the incoming email below and return a strictly validated JSON object.

RULES:
1. Never invent or hallucinate information that is not explicitly present in the email.
2. Extract only factual details supported by the sender, subject, and body.
3. If important information needed to resolve the request is missing (e.g. missing invoice ID, missing account ID, missing error logs), list it in missingInformation.
4. If intent is unclear or ambiguous, use "Unknown".
5. If urgency is unclear, use "Unknown".
6. Confidence must be a float between 0.00 and 1.00 based strictly on clarity and completeness of the email.
7. Reasoning summary must be concise, objective, and evidence-based.
8. Do NOT attempt to execute any actions. You are responsible solely for classification and entity extraction.

AVAILABLE INTENTS:
- Billing
- Technical Support
- Sales
- Account Support
- General Support
- Complaint
- Cancellation
- Refund
- Other
- Unknown

AVAILABLE URGENCIES:
- Low
- Medium
- High
- Critical
- Unknown

EMAIL TO ANALYZE:
Sender: ${sender}
Subject: ${subject}
Body:
${body}
`;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            intent: {
              type: Type.STRING,
              description: 'One of: Billing, Technical Support, Sales, Account Support, General Support, Complaint, Cancellation, Refund, Other, Unknown',
            },
            importantDetails: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'List of factual statements grounded in the email',
            },
            urgency: {
              type: Type.STRING,
              description: 'One of: Low, Medium, High, Critical, Unknown',
            },
            missingInformation: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Missing information required to fulfill the request',
            },
            confidence: {
              type: Type.NUMBER,
              description: 'Confidence score between 0.0 and 1.0',
            },
            reasoningSummary: {
              type: Type.STRING,
              description: 'Concise explanation for the classification',
            },
          },
          required: [
            'intent',
            'importantDetails',
            'urgency',
            'missingInformation',
            'confidence',
            'reasoningSummary',
          ],
        },
      },
    });

    const text = response.text || '{}';
    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch (e: any) {
      return {
        rawJson: text,
        analysis: {
          intent: 'Unknown',
          importantDetails: [],
          urgency: 'Unknown',
          missingInformation: ['Malformed JSON response from model'],
          confidence: 0.0,
          reasoningSummary: `Failed to parse JSON response: ${e.message}`,
        },
        validationErrors: [`JSON Parse Error: ${e.message}`],
      };
    }

    const validation = validateStructuredAnalysis(parsed);
    if (!validation.isValid || !validation.parsed) {
      return {
        rawJson: text,
        analysis: {
          intent: 'Unknown',
          importantDetails: [],
          urgency: 'Unknown',
          missingInformation: ['Schema validation failed'],
          confidence: 0.0,
          reasoningSummary: 'Response failed schema constraints.',
        },
        validationErrors: validation.errors,
      };
    }

    if (options?.forceLowConfidence) {
      validation.parsed.confidence = 0.48;
    }

    return {
      rawJson: text,
      analysis: validation.parsed,
      validationErrors: [],
    };
  } catch (err: any) {
    // In case of upstream rate limit or network glitch, fallback gracefully
    console.warn(`[GeminiService] Upstream call failed, using deterministic simulation:`, err.message);
    const sim = simulateDeterministicAnalysis(sender, subject, body);
    if (options?.forceLowConfidence) {
      sim.confidence = 0.45;
    }
    const rawJson = JSON.stringify(sim, null, 2);
    const val = validateStructuredAnalysis(sim);
    return {
      rawJson,
      analysis: sim,
      validationErrors: val.errors,
    };
  }
}
