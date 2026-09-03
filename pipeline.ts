import { store } from './store';
import { analyzeEmailWithGemini } from './geminiService';
import { evaluateDecisionAndGuardrails } from './decisionEngine';
import {
  AIAnalysis,
  Decision,
  Email,
  ProcessingRun,
  FinalOutcome,
} from '../src/types';

export interface ProcessEmailOptions {
  forceMalformedAI?: boolean;
  forceLLMFailure?: boolean;
  forceLowConfidence?: boolean;
  simulatedRetries?: number;
}

export async function processEmailPipeline(
  emailId: string,
  options?: ProcessEmailOptions
): Promise<{
  email: Email;
  run: ProcessingRun;
  analysis?: AIAnalysis;
  decision?: Decision;
}> {
  const email = store.emails.get(emailId);
  if (!email) {
    throw new Error(`Email ${emailId} not found`);
  }

  const startTime = Date.now();
  const runId = `run-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  
  email.status = 'PROCESSING';
  store.logAudit(email.id, 'EMAIL_VALIDATED', `Started pipeline processing for email ${email.id}`, {
    sender: email.sender,
    subject: email.subject,
  });

  const processingRun: ProcessingRun = {
    id: runId,
    emailId: email.id,
    status: 'RUNNING',
    startedAt: new Date().toISOString(),
    retryCount: 0,
    processingTimeMs: 0,
    attempts: [],
  };
  store.processingRuns.set(runId, processingRun);

  // Stage 1: Email Normalization & Length Validation
  if (!email.body || email.body.trim().length === 0) {
    const errorMsg = 'Email validation failed: Empty message body';
    email.status = 'FAILED';
    processingRun.status = 'FAILED';
    processingRun.error = errorMsg;
    processingRun.completedAt = new Date().toISOString();
    processingRun.processingTimeMs = Date.now() - startTime;
    store.logAudit(email.id, 'PROCESSING_FAILED', errorMsg);
    return { email, run: processingRun };
  }

  if (email.body.length > store.config.maxEmailLength) {
    const errorMsg = `Email exceeds maximum allowed character length of ${store.config.maxEmailLength}`;
    email.status = 'FAILED';
    processingRun.status = 'FAILED';
    processingRun.error = errorMsg;
    processingRun.completedAt = new Date().toISOString();
    processingRun.processingTimeMs = Date.now() - startTime;
    store.logAudit(email.id, 'PROCESSING_FAILED', errorMsg);
    return { email, run: processingRun };
  }

  // Stage 2: LLM Analysis with Retry Mechanism (Max 3 retries)
  const maxRetries = store.config.maxRetries || 3;
  let currentAttempt = 0;
  let analysisResult: any = null;
  let validationErrors: string[] = [];
  let rawJson = '';
  let successfulAttempt = false;

  while (currentAttempt <= maxRetries && !successfulAttempt) {
    currentAttempt++;
    const attemptStartTime = Date.now();

    store.logAudit(
      email.id,
      'AI_ANALYSIS_STARTED',
      `Attempt ${currentAttempt}/${maxRetries + 1}: Invoking LLM analysis engine`,
      { attempt: currentAttempt }
    );

    try {
      // If simulated retries is requested, fail previous attempts
      const shouldFailThisAttempt =
        options?.forceLLMFailure ||
        (options?.simulatedRetries && currentAttempt <= options.simulatedRetries);

      const result = await analyzeEmailWithGemini(
        email.id,
        email.sender,
        email.subject,
        email.body,
        {
          forceMalformed: options?.forceMalformedAI && currentAttempt > (options.simulatedRetries || 0),
          forceFailure: shouldFailThisAttempt,
          forceLowConfidence: options?.forceLowConfidence,
        }
      );

      rawJson = result.rawJson;
      analysisResult = result.analysis;
      validationErrors = result.validationErrors;

      if (validationErrors.length > 0 && currentAttempt <= maxRetries && !options?.forceMalformedAI) {
        // Retry on validation error
        store.logAudit(
          email.id,
          'SCHEMA_VALIDATION_FAILED',
          `Schema validation failed on attempt ${currentAttempt}: ${validationErrors.join('; ')}`
        );
        processingRun.attempts.push({
          attemptNumber: currentAttempt,
          timestamp: new Date().toISOString(),
          stage: 'LLM_SCHEMA_VALIDATION',
          success: false,
          error: validationErrors.join('; '),
          durationMs: Date.now() - attemptStartTime,
        });
        processingRun.retryCount++;
        // Small exponential delay simulation
        await new Promise((resolve) => setTimeout(resolve, Math.min(200 * currentAttempt, 600)));
        continue;
      }

      successfulAttempt = true;
      processingRun.attempts.push({
        attemptNumber: currentAttempt,
        timestamp: new Date().toISOString(),
        stage: 'LLM_ANALYSIS',
        success: true,
        durationMs: Date.now() - attemptStartTime,
      });

      store.logAudit(
        email.id,
        'AI_ANALYSIS_COMPLETED',
        `AI understanding complete (Intent: ${analysisResult.intent}, Confidence: ${(analysisResult.confidence * 100).toFixed(0)}%)`,
        {
          intent: analysisResult.intent,
          confidence: analysisResult.confidence,
          urgency: analysisResult.urgency,
        }
      );
    } catch (err: any) {
      const errorMsg = err.message || 'LLM execution error';
      processingRun.attempts.push({
        attemptNumber: currentAttempt,
        timestamp: new Date().toISOString(),
        stage: 'LLM_ANALYSIS',
        success: false,
        error: errorMsg,
        durationMs: Date.now() - attemptStartTime,
      });

      if (currentAttempt <= maxRetries) {
        processingRun.retryCount++;
        store.logAudit(
          email.id,
          'RETRY_TRIGGERED',
          `Retry triggered for attempt ${currentAttempt} due to: ${errorMsg}. Backoff scheduled.`,
          { retryCount: processingRun.retryCount }
        );
        await new Promise((resolve) => setTimeout(resolve, Math.min(250 * currentAttempt, 800)));
      } else {
        // Reached max retries - Escalate to Human Review per Prompt 5 rules!
        store.logAudit(
          email.id,
          'PROCESSING_FAILED',
          `Max retries (${maxRetries}) exhausted. Escalating email directly to Human Review queue.`,
          { error: errorMsg }
        );
      }
    }
  }

  // If all retries failed without valid output
  if (!successfulAttempt || !analysisResult) {
    analysisResult = {
      intent: 'Unknown',
      importantDetails: ['AI processing unavailable after multiple retries'],
      urgency: 'High',
      missingInformation: ['Automated analysis could not be generated'],
      confidence: 0.0,
      reasoningSummary: 'Upstream LLM processing failed after 3 consecutive retry attempts.',
    };
    validationErrors = ['Max retries exceeded'];
  }

  // Create and persist AIAnalysis record
  const analysisRecord: AIAnalysis = {
    id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    emailId: email.id,
    intent: analysisResult.intent,
    importantDetails: analysisResult.importantDetails || [],
    urgency: analysisResult.urgency,
    missingInformation: analysisResult.missingInformation || [],
    confidence: analysisResult.confidence,
    reasoningSummary: analysisResult.reasoningSummary,
    rawJson,
    validationPassed: validationErrors.length === 0,
    validationErrors,
    createdAt: new Date().toISOString(),
  };
  store.analyses.set(email.id, analysisRecord);

  // Stage 3: Deterministic Decision Engine & Safety Guardrails
  const memoriesList = Array.from(store.feedbackMemories.values());
  const decisionRecord = evaluateDecisionAndGuardrails(
    email.id,
    email.subject,
    email.body,
    analysisRecord,
    memoriesList,
    store.config.minConfidenceThreshold
  );

  if (decisionRecord.feedbackMemoryMatched) {
    store.logAudit(
      email.id,
      'FEEDBACK_MEMORY_MATCHED',
      `Feedback memory matched: "${decisionRecord.feedbackMemoryMatched.matchedSnippet}" -> Suggesting ${decisionRecord.feedbackMemoryMatched.suggestedAction}`,
      { memoryId: decisionRecord.feedbackMemoryMatched.memoryId }
    );
  }

  if (decisionRecord.safetyFlags.length > 0) {
    decisionRecord.safetyFlags.forEach((flag) => {
      store.logAudit(
        email.id,
        'SAFETY_BLOCK',
        `Safety guardrail triggered: [${flag.severity}] ${flag.description}`,
        { rule: flag.triggeredRule }
      );
    });
  }

  // Stage 4: Determine Final Status
  let finalOutcome: FinalOutcome;
  if (decisionRecord.requiresHumanApproval) {
    email.status = 'HUMAN_REVIEW';
    finalOutcome = 'Human Review';
    store.logAudit(
      email.id,
      'HUMAN_REVIEW_REQUIRED',
      `Email routed to Human Review queue. Action: ${decisionRecord.recommendedAction} (Risk: ${decisionRecord.riskLevel})`,
      { reason: decisionRecord.reason }
    );
  } else {
    email.status = 'COMPLETED';
    finalOutcome = 'Completed';
    store.logAudit(
      email.id,
      'FINAL_OUTCOME_RECORDED',
      `Email auto-completed. Recommended Action: ${decisionRecord.recommendedAction} (Risk: ${decisionRecord.riskLevel})`,
      { action: decisionRecord.recommendedAction }
    );
  }

  decisionRecord.finalOutcome = finalOutcome;
  store.decisions.set(email.id, decisionRecord);

  processingRun.status = 'SUCCESS';
  processingRun.completedAt = new Date().toISOString();
  processingRun.processingTimeMs = Date.now() - startTime;

  return {
    email,
    run: processingRun,
    analysis: analysisRecord,
    decision: decisionRecord,
  };
}
