import {
  Email,
  ProcessingRun,
  AIAnalysis,
  Decision,
  HumanFeedback,
  FeedbackMemory,
  AuditEvent,
  SystemConfig,
  SystemHealthStats,
} from '../src/types';

export class Store {
  emails: Map<string, Email> = new Map();
  processingRuns: Map<string, ProcessingRun> = new Map();
  analyses: Map<string, AIAnalysis> = new Map();
  decisions: Map<string, Decision> = new Map();
  feedbacks: Map<string, HumanFeedback> = new Map();
  feedbackMemories: Map<string, FeedbackMemory> = new Map();
  auditEvents: AuditEvent[] = [];
  config: SystemConfig = {
    maxRetries: 3,
    maxEmailLength: 4000,
    maxOutputTokens: 1024,
    maxProcessingTimeMs: 15000,
    minConfidenceThreshold: 0.70,
    enableRealGemini: true,
  };

  constructor() {
    this.seedInitialData();
  }

  seedInitialData() {
    this.emails.clear();
    this.processingRuns.clear();
    this.analyses.clear();
    this.decisions.clear();
    this.feedbacks.clear();
    this.feedbackMemories.clear();
    this.auditEvents = [];

    // Pre-seed Feedback Memory: "charged twice" correction demo
    const initialMemoryId = 'mem-demo-1';
    this.feedbackMemories.set(initialMemoryId, {
      id: initialMemoryId,
      exampleEmailSubject: 'Can you explain why I was charged twice?',
      exampleEmailBody: 'I checked my monthly statement and there are two identical $49 charges on May 3rd. Please clarify why this happened.',
      keywords: ['charged', 'twice', 'statement', 'duplicate', 'double charge', 'fee'],
      correctedIntent: 'Billing',
      correctedUrgency: 'Medium',
      correctedAction: 'Route to Billing',
      reviewerNote: 'User questioning duplicate charges should always route to Billing, even if phrased generally.',
      timesApplied: 1,
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    });

    const sampleEmails: Array<Omit<Email, 'receivedAt'> & { receivedHoursAgo: number }> = [
      {
        id: 'em-101',
        sender: 'sarah.connor@acme-corp.com',
        subject: 'Invoice #INV-2026-8849 Payment Verification',
        body: 'Hello Team,\n\nWe remitted wire payment for invoice #INV-2026-8849 on Monday for $1,250.00. Could you please confirm if the payment has been matched to our enterprise account and send the updated receipt?\n\nThank you,\nSarah Connor\nAcme Corp Accounts Payable',
        status: 'RECEIVED',
        categoryTag: 'Billing',
        simulatedScenario: 'Normal Billing verification inquiry with complete details',
        receivedHoursAgo: 2,
      },
      {
        id: 'em-102',
        sender: 'dev-lead@startup.io',
        subject: 'CRITICAL: Production API 500 Internal Server Error with SDK v4.2',
        body: 'Hi Support,\n\nOur production workers started throwing HTTP 500 when invoking the /v2/batch-process endpoint using Node SDK v4.2. Request trace ID is trc-9982-ab71. We are completely blocked in US-East-1 cluster.\n\nLogs:\nError: Connection reset by peer at Worker.send (/node_modules/sdk/dist.js:142)\n\nPlease escalate immediately.',
        status: 'RECEIVED',
        categoryTag: 'Technical Support',
        simulatedScenario: 'High urgency technical support issue with clear error trace',
        receivedHoursAgo: 1,
      },
      {
        id: 'em-103',
        sender: 'procurement@globalretail.org',
        subject: 'Enterprise License Expansion — Quote Request for 500 Seats',
        body: 'Good morning,\n\nOur organization is looking to expand our current 50-seat pilot to 500 enterprise seats across North America and EMEA. We require SOC2 Type II compliance documents, custom SSO integration support, and annual invoicing terms.\n\nCould we schedule a call with your enterprise sales team this Thursday?',
        status: 'RECEIVED',
        categoryTag: 'Sales',
        simulatedScenario: 'High value enterprise sales lead requesting custom pricing',
        receivedHoursAgo: 4,
      },
      {
        id: 'em-104',
        sender: 'angry.customer@consumer.net',
        subject: 'UNACCEPTABLE OUTAGE! Fourth time this week — Demand explanation now!!',
        body: 'I have had it with your service! My client presentation failed completely today because your sync service crashed without warning for the 4th time this week. This is causing direct financial loss to my business and I will be posting on social media and filing an executive complaint if this is not resolved in 1 hour.',
        status: 'RECEIVED',
        categoryTag: 'Urgent Complaint',
        simulatedScenario: 'Critical urgency complaint with high churn risk',
        receivedHoursAgo: 0.5,
      },
      {
        id: 'em-105',
        sender: 'alex.morgan@freemail.com',
        subject: 'Help regarding my issue',
        body: 'Hey,\n\nIt is still not working right. Can someone fix the problem that happened yesterday?\n\nThanks,\nAlex',
        status: 'RECEIVED',
        categoryTag: 'Ambiguous Request',
        simulatedScenario: 'Ambiguous email with no context or identifier',
        receivedHoursAgo: 5,
      },
      {
        id: 'em-106',
        sender: 'jessica.lee@designstudio.co',
        subject: 'Need refund for my subscription renewal',
        body: 'Hi,\n\nMy subscription renewed automatically this morning for $299/yr, but I meant to cancel before the renewal date. I have not used any credits from the new billing cycle. Could you please issue a full refund to my card ending in 4119 and cancel the recurring plan?',
        status: 'RECEIVED',
        categoryTag: 'Refund',
        simulatedScenario: 'Financial refund request — must trigger Safety Guardrails',
        receivedHoursAgo: 3,
      },
      {
        id: 'em-107',
        sender: 'marcus.vance@techcorp.com',
        subject: 'Requesting deletion of all user records under GDPR Article 17',
        body: 'To Data Protection Officer,\n\nUnder GDPR Article 17 (Right to Erasure), I formally request the permanent deletion of my account (marcus.vance@techcorp.com) and all associated telemetry, logs, and database records. Please confirm execution within 30 days.',
        status: 'RECEIVED',
        categoryTag: 'High-Impact Financial / Deletion Request',
        simulatedScenario: 'Irreversible data deletion request requiring Human Approval',
        receivedHoursAgo: 6,
      },
      {
        id: 'em-108',
        sender: 'clara.oswald@domain.co.uk',
        subject: 'Please cancel our annual contract renewal',
        body: 'Hello Support,\n\nPlease set our organization account (Org ID: ORG-55120) to NOT renew at the end of our current term on October 31, 2026. We are consolidating our software vendors.\n\nBest regards,\nClara Oswald\nHead of Operations',
        status: 'RECEIVED',
        categoryTag: 'Cancellation',
        simulatedScenario: 'Account cancellation requiring safety evaluation',
        receivedHoursAgo: 7,
      },
      {
        id: 'em-109',
        sender: 'david.b@webmail.org',
        subject: 'Missing widget in settings',
        body: 'Hi,\n\nI was trying to set up webhooks according to your documentation, but I cannot locate the Webhooks tab in my workspace settings. Where can I find this feature?',
        status: 'RECEIVED',
        categoryTag: 'General Support',
        simulatedScenario: 'Standard information guidance request',
        receivedHoursAgo: 8,
      },
      {
        id: 'em-110',
        sender: 'linda.k@enterprise.io',
        subject: 'I was charged twice on my card. Please check.',
        body: 'Hello,\n\nI noticed two separate deductions of $99 on my Visa card on the same date for order #ORD-4491. Please check and let me know why there was a duplicate charge.',
        status: 'RECEIVED',
        categoryTag: 'Feedback Memory Demo',
        simulatedScenario: 'Similar email testing Feedback Memory matching',
        receivedHoursAgo: 0.2,
      },
    ];

    sampleEmails.forEach((item) => {
      const email: Email = {
        id: item.id,
        sender: item.sender,
        subject: item.subject,
        body: item.body,
        status: item.status,
        categoryTag: item.categoryTag,
        simulatedScenario: item.simulatedScenario,
        receivedAt: new Date(Date.now() - item.receivedHoursAgo * 3600000).toISOString(),
      };
      this.emails.set(email.id, email);

      this.logAudit(
        email.id,
        'EMAIL_RECEIVED',
        `Email received from ${email.sender} with subject "${email.subject}"`,
        { sender: email.sender, subject: email.subject }
      );
    });
  }

  logAudit(
    emailId: string,
    eventType: AuditEvent['eventType'],
    message: string,
    metadata?: Record<string, any>
  ): AuditEvent {
    // Sanitize metadata to never log keys/passwords
    const sanitizedMetadata = metadata ? { ...metadata } : undefined;
    if (sanitizedMetadata) {
      delete sanitizedMetadata.apiKey;
      delete sanitizedMetadata.password;
      delete sanitizedMetadata.secret;
      delete sanitizedMetadata.token;
    }

    const event: AuditEvent = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      emailId,
      eventType,
      message,
      timestamp: new Date().toISOString(),
      metadata: sanitizedMetadata,
    };

    this.auditEvents.unshift(event);
    if (this.auditEvents.length > 500) {
      this.auditEvents.pop();
    }
    return event;
  }

  getStats(): SystemHealthStats {
    let autoCompleted = 0;
    let humanReview = 0;
    let failed = 0;
    let totalProcessingTime = 0;
    let processingRunsCount = 0;
    let totalRetries = 0;
    let safetyBlocks = 0;

    this.emails.forEach((email) => {
      if (email.status === 'COMPLETED') autoCompleted++;
      if (email.status === 'HUMAN_REVIEW') humanReview++;
      if (email.status === 'FAILED') failed++;
    });

    this.processingRuns.forEach((run) => {
      processingRunsCount++;
      totalProcessingTime += run.processingTimeMs || 0;
      totalRetries += run.retryCount || 0;
    });

    this.decisions.forEach((dec) => {
      if (dec.safetyFlags && dec.safetyFlags.length > 0) {
        safetyBlocks++;
      }
    });

    const processedCount = autoCompleted + humanReview + failed;
    const avgTime = processingRunsCount > 0 ? Math.round(totalProcessingTime / processingRunsCount) : 480;
    const successRate = processedCount > 0 ? Math.round(((autoCompleted + humanReview) / processedCount) * 100) : 100;

    const hasApiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 5);

    return {
      llmStatus: hasApiKey ? 'ONLINE' : 'SIMULATED',
      apiKeyConfigured: hasApiKey,
      totalEmails: this.emails.size,
      processedCount,
      autoCompletedCount: autoCompleted,
      humanReviewCount: humanReview,
      safetyBlockCount: safetyBlocks,
      retryCount: totalRetries,
      failedCount: failed,
      averageProcessingTimeMs: avgTime,
      successRate,
      feedbackMemoryCount: this.feedbackMemories.size,
      auditEventsCount: this.auditEvents.length,
    };
  }
}

export const store = new Store();
