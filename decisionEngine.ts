import {
  AIAnalysis,
  Decision,
  FeedbackMemory,
  RecommendedAction,
  RiskLevel,
  SafetyFlag,
} from '../src/types';

export function matchFeedbackMemory(
  subject: string,
  body: string,
  memories: FeedbackMemory[]
): FeedbackMemory | null {
  const combined = `${subject} ${body}`.toLowerCase();

  for (const memory of memories) {
    let matchCount = 0;
    for (const keyword of memory.keywords) {
      if (combined.includes(keyword.toLowerCase())) {
        matchCount++;
      }
    }
    // If at least 2 keywords match or 50% of keywords match
    if (matchCount >= 2 || (memory.keywords.length === 1 && matchCount === 1)) {
      return memory;
    }
  }

  return null;
}

export function evaluateDecisionAndGuardrails(
  emailId: string,
  subject: string,
  body: string,
  analysis: AIAnalysis,
  memories: FeedbackMemory[],
  minConfidenceThreshold = 0.70
): Decision {
  const safetyFlags: SafetyFlag[] = [];
  const combinedText = `${subject} ${body}`.toLowerCase();

  // 1. Safety Check: Missing Required Information
  if (analysis.missingInformation && analysis.missingInformation.length > 0) {
    safetyFlags.push({
      type: 'MISSING_INFO',
      severity: 'Medium',
      description: `Missing critical parameters required to fulfill request: ${analysis.missingInformation.join(', ')}`,
      triggeredRule: 'RULE_1: Missing required information prevents automated processing.',
    });
  }

  // 2. Safety Check: AI Schema or Parse Malfunction
  if (!analysis.validationPassed || analysis.intent === 'Unknown') {
    safetyFlags.push({
      type: 'UNKNOWN_INTENT',
      severity: 'Medium',
      description: 'Intent is unknown or ambiguous; cannot determine automated routing path.',
      triggeredRule: 'RULE_2: Unknown or ambiguous intent requires Human Review.',
    });
  }

  // 3. Safety Check: Low Confidence
  if (analysis.confidence < minConfidenceThreshold) {
    safetyFlags.push({
      type: 'LOW_CONFIDENCE',
      severity: 'Medium',
      description: `AI confidence score (${(analysis.confidence * 100).toFixed(0)}%) is below the safety threshold (${(minConfidenceThreshold * 100).toFixed(0)}%).`,
      triggeredRule: `RULE_3: Confidence below ${minConfidenceThreshold * 100}% triggers mandatory Human Review.`,
    });
  }

  // 4. Safety Check: Financial Action & Refund Request
  const isRefundOrFinancial =
    analysis.intent === 'Refund' ||
    combinedText.includes('refund') ||
    combinedText.includes('money back') ||
    combinedText.includes('overcharge') ||
    combinedText.includes('charged twice') ||
    combinedText.includes('credit back');

  if (isRefundOrFinancial) {
    safetyFlags.push({
      type: 'REFUND_REQUEST',
      severity: 'Critical',
      description: 'Request involves financial transactions, refunds, or payment reversals. Automated execution is prohibited.',
      triggeredRule: 'RULE_5_6: Financial transactions and refund actions require Human Approval.',
    });
  }

  // 5. Safety Check: Account Ownership, Security, Deletion, Irreversible Actions
  const isDeletionOrSecurity =
    combinedText.includes('gdpr') ||
    combinedText.includes('erasure') ||
    combinedText.includes('delete account') ||
    combinedText.includes('deletion') ||
    combinedText.includes('transfer ownership') ||
    combinedText.includes('password reset link') ||
    combinedText.includes('change email');

  if (isDeletionOrSecurity) {
    safetyFlags.push({
      type: 'DELETION_OR_IRREVERSIBLE',
      severity: 'Critical',
      description: 'Permanent data erasure or security/ownership change detected. Strict human verification mandatory.',
      triggeredRule: 'RULE_7_8_9: Account ownership, security changes, and data deletions require Human Review.',
    });
  }

  // 6. Safety Check: Cancellation Request
  const isCancellation = analysis.intent === 'Cancellation' || combinedText.includes('cancel') || combinedText.includes('not renew');
  if (isCancellation && !isRefundOrFinancial && !isDeletionOrSecurity) {
    safetyFlags.push({
      type: 'HIGH_IMPACT_COMPLAINT',
      severity: 'High',
      description: 'Contract cancellation involves subscription changes and customer retention review.',
      triggeredRule: 'RULE_4: High-impact contractual changes require Human Review.',
    });
  }

  // 7. Safety Check: Critical Complaint
  if (analysis.urgency === 'Critical' || analysis.intent === 'Complaint') {
    safetyFlags.push({
      type: 'HIGH_IMPACT_COMPLAINT',
      severity: 'High',
      description: 'Critical urgency or executive-level complaint detected. Priority human review required.',
      triggeredRule: 'RULE_10: Urgency highlights risk and must never bypass safety guardrails.',
    });
  }

  // Check Feedback Memory
  const matchedMemory = matchFeedbackMemory(subject, body, memories);
  let feedbackMetadata: Decision['feedbackMemoryMatched'] = undefined;

  if (matchedMemory) {
    feedbackMetadata = {
      memoryId: matchedMemory.id,
      matchedSnippet: `Matched rule for: "${matchedMemory.exampleEmailSubject}"`,
      suggestedIntent: matchedMemory.correctedIntent,
      suggestedAction: matchedMemory.correctedAction,
      reviewerNote: matchedMemory.reviewerNote,
      similarityScore: 0.88,
    };
  }

  // Deterministic Decision Resolution
  let recommendedAction: RecommendedAction = 'Unable to Determine';
  let riskLevel: RiskLevel = 'Low';
  let requiresHumanApproval = false;
  let reason = '';

  // Determine effective intent (AI intent or feedback informed)
  const effectiveIntent = matchedMemory ? matchedMemory.correctedIntent : analysis.intent;

  // Rule Evaluation Priority
  if (safetyFlags.some((f) => f.type === 'DELETION_OR_IRREVERSIBLE')) {
    recommendedAction = 'Human Review';
    riskLevel = 'Critical';
    requiresHumanApproval = true;
    reason = 'Permanent data deletion or security credential modification requires strict human authorization.';
  } else if (safetyFlags.some((f) => f.type === 'REFUND_REQUEST')) {
    recommendedAction = 'Recommend Refund';
    riskLevel = 'Critical';
    requiresHumanApproval = true;
    reason = 'Financial refund recommendation generated by system. Must be verified and approved by billing agent.';
  } else if (effectiveIntent === 'Cancellation') {
    recommendedAction = 'Recommend Cancellation';
    riskLevel = 'High';
    requiresHumanApproval = true;
    reason = 'Account cancellation request flagged for human operator verification.';
  } else if (safetyFlags.some((f) => f.type === 'MISSING_INFO')) {
    recommendedAction = 'Ask for Missing Information';
    riskLevel = 'Medium';
    requiresHumanApproval = false;
    reason = `Customer inquiry lacks essential context (${analysis.missingInformation.join(', ')}). System recommends dispatching missing-info template.`;
  } else if (safetyFlags.some((f) => f.type === 'LOW_CONFIDENCE' || f.type === 'UNKNOWN_INTENT')) {
    recommendedAction = 'Human Review';
    riskLevel = 'Medium';
    requiresHumanApproval = true;
    reason = `AI understanding was ambiguous (Confidence: ${(analysis.confidence * 100).toFixed(0)}%, Intent: ${analysis.intent}). Escalated to Human Review queue.`;
  } else if (analysis.urgency === 'Critical' || effectiveIntent === 'Complaint') {
    recommendedAction = 'Human Review';
    riskLevel = 'High';
    requiresHumanApproval = true;
    reason = 'Critical urgency complaint routed for immediate human supervisor intervention.';
  } else {
    // Deterministic Clean Department Routing
    switch (effectiveIntent) {
      case 'Billing':
        recommendedAction = 'Route to Billing';
        riskLevel = 'Low';
        requiresHumanApproval = false;
        reason = 'Standard verified invoice or payment confirmation inquiry routed to Billing team.';
        break;
      case 'Technical Support':
        recommendedAction = 'Route to Technical Support';
        riskLevel = 'Low';
        requiresHumanApproval = false;
        reason = 'Technical bug report with valid diagnostics routed to Engineering & Tech Support.';
        break;
      case 'Sales':
        recommendedAction = 'Route to Sales';
        riskLevel = 'Low';
        requiresHumanApproval = false;
        reason = 'Commercial lead and licensing expansion inquiry routed to Enterprise Sales.';
        break;
      case 'Account Support':
        recommendedAction = 'Route to Account Support';
        riskLevel = 'Low';
        requiresHumanApproval = false;
        reason = 'Account configuration inquiry routed to Customer Account team.';
        break;
      case 'General Support':
        recommendedAction = 'Provide Information';
        riskLevel = 'Low';
        requiresHumanApproval = false;
        reason = 'Standard product guidance inquiry. System recommends providing self-service documentation.';
        break;
      default:
        recommendedAction = 'Human Review';
        riskLevel = 'Medium';
        requiresHumanApproval = true;
        reason = 'Unclassified email intent requires human assessment.';
    }
  }

  // If any critical/high safety flags exist, ensure requiresHumanApproval is set
  if (safetyFlags.some((f) => f.severity === 'Critical' || f.severity === 'High')) {
    requiresHumanApproval = true;
    if (riskLevel === 'Low') riskLevel = 'High';
  }

  return {
    id: `dec-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    emailId,
    recommendedAction,
    riskLevel,
    requiresHumanApproval,
    reason,
    safetyFlags,
    feedbackMemoryMatched: feedbackMetadata,
    createdAt: new Date().toISOString(),
  };
}
