import React, { useState } from 'react';
import {
  FileText,
  BookOpen,
  Layers,
  Database,
  CheckCircle2,
  HelpCircle,
  Play,
  AlertOctagon,
  Copy,
  Check,
} from 'lucide-react';

export const DocumentationView: React.FC = () => {
  const [activeDoc, setActiveDoc] = useState<string>('README');
  const [copied, setCopied] = useState<boolean>(false);

  const docs = [
    { id: 'README', label: 'README.md', icon: BookOpen },
    { id: 'ARCHITECTURE', label: 'ARCHITECTURE.md', icon: Layers },
    { id: 'DATA_MODEL', label: 'DATA_MODEL.md', icon: Database },
    { id: 'TEST_CASES', label: 'TEST_CASES.md', icon: CheckCircle2 },
    { id: 'DESIGN_DECISIONS', label: 'DESIGN_DECISIONS.md', icon: HelpCircle },
    { id: 'DEMO', label: 'DEMO.md (Walkthrough)', icon: Play },
    { id: 'LIMITATIONS', label: 'LIMITATIONS.md', icon: AlertOctagon },
  ];

  const docContents: Record<string, string> = {
    README: `# InboxPilot — AI-Powered Email Processing System

> **Junior Engineer Assessment Submission**  
> *A production-minded, human-in-the-loop email automation pipeline utilizing Gemini AI understanding paired with deterministic safety guardrails, feedback memory, and audit logging.*

---

## 1. Problem Statement
Support and operations teams receive hundreds of incoming emails daily spanning diverse intents: urgent outages, billing disputes, enterprise sales inquiries, account cancellations, and ambiguous requests.

Naive LLM implementations suffer from two critical hazards:
1. **Hallucination & Unpredictability:** An LLM may attempt to execute destructive external actions (e.g. issuing refunds or deleting user records) without authorization.
2. **Brittle Automations:** LLMs can misclassify ambiguous or missing-information queries, leading to incorrect automated routing.

---

## 2. Solution Overview
**InboxPilot** solves this by establishing a strict architectural separation:
- **LLM Layer (Gemini):** Responsible **solely** for entity extraction, intent understanding, and factual confidence calculation. It **never** executes actions.
- **Deterministic Decision Engine & Safety Guardrails:** Code-governed business rules evaluate the AI payload against strict security boundaries.
- **Human Review & Feedback Memory:** Any high-impact, low-confidence, or financial request is escalated to human operators. Operator corrections are stored in a lightweight **Feedback Memory** to guide future similar emails without claiming dangerous black-box model retraining.

---

## 3. Key Features
- **Multi-Stage Email Processing Pipeline:** Validates and normalizes inputs, extracts structured JSON schemas via Gemini, validates outputs, and routes through business rules.
- **Deterministic Safety Guardrails:**
  - Automated blocks on financial transactions, refunds, cancellations, and data erasures.
  - Mandatory human review for confidence < 0.70 or unknown intents.
  - Detection of missing parameters (e.g., missing invoice IDs) triggering clarification requests.
- **Human Approval & Review Queue:** Side-by-side comparison of original email, AI analysis, triggered safety flags, and simulated action approvals.
- **Human Feedback Loop & Feedback Memory:** Human corrections create search-indexed memory records that provide feedback-informed suggestions for future similar emails.
- **Resilient Retry Handling:** Up to 3 retries with exponential backoff on timeouts or malformed payloads, with graceful fallback to Human Review upon exhaustion.
- **Comprehensive Audit Logger:** Every pipeline stage, attempt, safety check, and reviewer decision is recorded in an immutable, sanitized audit log.
- **Automated 12-Scenario Test Suite:** 1-click execution verifying classification, safety, retries, and feedback memory.
- **System Health Monitor:** Real-time visibility into LLM gateway status, processing latencies, error rates, and configurable limits.`,

    ARCHITECTURE: `# System Architecture & Flow Specifications

## 1. System Pipeline Architecture

\`\`\`
                       ┌──────────────────────┐
                       │     Incoming Email   │
                       │ Sender / Subject /   │
                       │ Body / Timestamp     │
                       └──────────┬───────────┘
                                  │
                                  ▼
                       ┌──────────────────────┐
                       │   Email Processor    │
                       │ Validate + Normalize │
                       │ Length / Input Check │
                       └──────────┬───────────┘
                                  │
                                  ▼
                       ┌──────────────────────┐
                       │    LLM AI Analysis   │
                       │    Gemini 3.8 Flash  │
                       │                      │
                       │ • Intent             │
                       │ • Important Details  │
                       │ • Urgency            │
                       │ • Missing Info       │
                       │ • Confidence         │
                       │ • Reasoning          │
                       └──────────┬───────────┘
                                  │
                                  ▼
                       ┌──────────────────────┐
                       │ Structured Output    │
                       │     Validation       │
                       │                      │
                       │ Valid JSON?          │
                       │ Required fields?     │
                       │ Confidence valid?    │
                       └──────────┬───────────┘
                                  │
                       ┌──────────┴──────────┐
                       │                     │
                     VALID                INVALID
                       │                     │
                       ▼                     ▼
            ┌──────────────────┐   ┌──────────────────┐
            │ Decision Engine  │   │ Retry Handler    │
            │                  │   │                  │
            │ Deterministic    │   │ Retry ≤ 3        │
            │ Business Rules   │   │ Backoff          │
            └────────┬─────────┘   └────────┬─────────┘
                     │                      │
                     │               Max retries?
                     │                      │
                     │                      ▼
                     │              ┌────────────────┐
                     │              │ Human Review   │
                     │              └────────────────┘
                     ▼
            ┌──────────────────────┐
            │   Safety Guardrails  │
            │                      │
            │ • Missing info       │
            │ • Low confidence     │
            │ • Financial action   │
            │ • Refund             │
            │ • Security change    │
            │ • Deletion           │
            │ • Irreversible act.  │
            └──────────┬───────────┘
                       │
             ┌─────────┴─────────┐
             │                   │
           SAFE              HIGH RISK
             │                   │
             ▼                   ▼
     ┌──────────────┐    ┌──────────────────┐
     │ Recommended  │    │  Human Review    │
     │    Action    │    │                  │
     │              │    │ Approve          │
     │ Route / Info │    │ Reject           │
     │ / Ask Info   │    │ Request Info     │
     └──────┬───────┘    └────────┬─────────┘
            │                     │
            └──────────┬──────────┘
                       ▼
              ┌──────────────────┐
              │   Final Outcome  │
              │                  │
              │ Completed        │
              │ Human Approved   │
              │ Rejected         │
              │ More Info Needed │
              │ Human Review     │
              └────────┬─────────┘
                       │
                       ▼
              ┌──────────────────┐
              │   Audit Logger   │
              │                  │
              │ Every processing │
              │ event recorded   │
              └──────────────────┘
\`\`\`

---

## 2. Human Feedback & Feedback Memory Loop

\`\`\`
     ┌────────────────────────────────────────────┐
     │             FEEDBACK LOOP                  │
     │                                            │
     │ Human Correction                           │
     │        │                                   │
     │        ▼                                   │
     │ HumanFeedback                              │
     │        │                                   │
     │        ▼                                   │
     │ FeedbackMemory                             │
     │        │                                   │
     │        ▼                                   │
     │ Similar Future Email                       │
     │        │                                   │
     │        ▼                                   │
     │ Feedback-Informed Suggestion               │
     │                                            │
     │ Safety rules ALWAYS remain active          │
     └────────────────────────────────────────────┘
\`\`\``,

    DATA_MODEL: `# InboxPilot Data Models & Schemas

## 1. Entity Relationship Overview
\`\`\`
Email (1) ──► ProcessingRun (1..N)
          ──► AIAnalysis (1) ──► Decision (1) ──► AuditEvent (1..N)
          ──► HumanFeedback (0..1) ──► FeedbackMemory (1) ──► Future Suggestion
\`\`\`

## 2. Key Interfaces
- **Email:** Core incoming message entity (id, sender, subject, body, receivedAt, status).
- **ProcessingRun:** Lifecycle execution telemetry with waterfall attempt tracking and duration logs.
- **AIAnalysis:** Structured Gemini entity extraction containing intent, details, urgency, missing info, confidence, and reasoning.
- **Decision:** Output of the deterministic decision engine with risk level, recommended action, safety flags, and human review status.
- **HumanFeedback & FeedbackMemory:** Auditable operator corrections and indexed keyword knowledge base.
- **AuditEvent:** Immutable sanitized event trail.`,

    TEST_CASES: `# Test Suite Specifications & Verification Matrix

The InboxPilot system includes 12 automated test scenarios designed to validate AI understanding, deterministic logic, retry resilience, safety guardrails, and the human feedback loop.

| # | Test Scenario | Category | Input Payload | Expected Behavior | Safety Flag |
| :- | :--- | :--- | :--- | :--- | :--- |
| **01** | **Normal Billing Email** | Classification | Wire payment inquiry with invoice ID & amount | Classifies as Billing, routes to Billing, risk Low, auto-completes. | None |
| **02** | **Technical Support Email** | Classification | API HTTP 500 error log with trace ID | Classifies as Tech Support, routes to Engineering. | None |
| **03** | **Enterprise Sales Lead** | Classification | 200-seat license expansion quote request | Classifies as Sales, routes to Sales team. | None |
| **04** | **Ambiguous Request** | Safety & Guardrails | "It is not working right. Can you fix it?" | Low confidence / Unknown intent, escalates to Human Review. | UNKNOWN_INTENT |
| **05** | **Missing Information** | Safety & Guardrails | "Issue with recent invoice" (no ID) | Detects missing invoice identifier, recommends Ask for Missing Info. | MISSING_INFO |
| **06** | **Urgent Complaint** | Safety & Guardrails | Outage during client demo, critical urgency | Classifies as Complaint, urgency Critical, escalates to Human Review. | HIGH_IMPACT_COMPLAINT |
| **07** | **Low-Confidence AI** | Safety & Guardrails | Ambiguous prompt resulting in confidence < 0.70 | Blocks automated routing, requires human review. | LOW_CONFIDENCE |
| **08** | **High-Impact Refund** | Safety & Guardrails | "$299 refund for subscription renewal" | Flags REFUND_REQUEST, risk Critical, blocks payout, requires Human Approval. | REFUND_REQUEST |
| **09** | **LLM Gateway Failure** | Reliability & Retries | Simulated 503 AI API timeout | Executes 3 retries with backoff; on failure, escalates to Human Review. | AI_MALFUNCTION |
| **10** | **Malformed AI Response** | Reliability & Retries | Corrupted JSON output missing required fields | Trapped by schema validator; retries and safely escalates to Human Review. | UNKNOWN_INTENT |
| **11** | **Human Correction** | Feedback Loop | Reviewer corrects intent from General Support to Billing | Creates auditable HumanFeedback & FeedbackMemory without model retraining. | None |
| **12** | **Feedback Memory Match** | Feedback Loop | "I was charged twice on my card" | Matches previous memory, suggests Billing while keeping safety active! | REFUND_REQUEST |`,

    DESIGN_DECISIONS: `# Architectural & Engineering Design Decisions

1. **Separation of LLM Understanding from Decision Logic:** The LLM is strictly constrained to entity extraction and semantic classification. Purely deterministic code guarantees verifiable business policy compliance.
2. **Mandatory Human Approval for High-Impact & Financial Actions:** Any request involving refunds, payments, cancellations, or GDPR deletions is flagged as High/Critical risk and requires explicit human review.
3. **Missing Information Blocks Automated Progression:** The system asks for clarification rather than guessing customer context.
4. **Confidence Threshold Enforcement (< 0.70 -> Human Review):** Uncertain classifications are safely diverted from automated progression.
5. **Lightweight Feedback Memory vs. Model Fine-Tuning:** Uses indexed keyword/similarity matching over historical reviewer corrections rather than dangerous online model retraining.
6. **Max Retries Limit (3) with Escalation:** Transient failures retry up to 3 times before escalating to Human Review.
7. **Simulated External Actions:** Financial and external mutations are explicitly labeled as simulated.
8. **Server-Side Secret Management:** Keys reside exclusively in the Express backend.`,

    DEMO: `# Step-by-Step 5–10 Minute Walkthrough Demo

1. **Open Dashboard:** Observe aggregate metrics, active pipeline architecture flow, and real-time audit event logs.
2. **Open Inbox:** View pre-seeded synthetic test emails covering Billing, Technical Support, Sales, Missing Info, and Refunds.
3. **Process Normal Email:** Select Email #101 ("Invoice Payment Verification"), click "Process Email", and watch safe auto-completion to Billing.
4. **Process Ambiguous Email:** Select Email #105 ("Help regarding my issue"), click "Process Email", observe confidence < 0.70 and escalation to Human Review.
5. **Process High-Impact Refund:** Select Email #106 ("Need refund for subscription renewal"), observe triggered safety guardrail [CRITICAL] REFUND_REQUEST and mandatory Human Approval.
6. **Perform Human Review:** Navigate to Human Review tab, inspect side-by-side evidence, and click "Approve Simulated Action".
7. **Test Feedback Loop:** Navigate to Feedback Loop, test similarity matching, and observe that safety guardrails remain active.
8. **Run Automated Test Suite:** Navigate to Test Cases and click "Run All 12 Test Cases" to see 100% green verification.`,

    LIMITATIONS: `# System Limitations & Production Readiness Road Map

## Current Limitations:
1. **Synthetic Sample Data:** Uses structured synthetic emails rather than raw MIME streams.
2. **Feedback Memory Indexing:** Uses keyword/ngram matching rather than dense vector embeddings.
3. **Simulated External Actions:** Refunds and cancellations are safely simulated in state without live Stripe/CRM webhooks.

## Production Enhancements:
- **Cloud SQL / PostgreSQL Persistence** with ACID transactions.
- **Dense Vector Search** for FeedbackMemory using Gemini Embeddings.
- **Enterprise SSO / RBAC** for support tiers and compliance officers.
- **Distributed Queues (BullMQ / Pub/Sub)** with dead-letter queues.
- **Live Webhook Integrations** to Jira, Zendesk, Salesforce, and Stripe.`,
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(docContents[activeDoc] || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto pb-12 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <FileText className="w-6 h-6 text-indigo-400" />
            <span>Assessment System Documentation</span>
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Complete technical specifications, architecture diagrams, data schemas, design decisions, and demo walkthrough.
          </p>
        </div>

        <button
          onClick={handleCopy}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Copied Markdown!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copy Document</span>
            </>
          )}
        </button>
      </div>

      {/* Document Tab Selector */}
      <div className="flex space-x-1.5 p-1.5 bg-slate-900 rounded-2xl border border-slate-800 overflow-x-auto scrollbar-none">
        {docs.map((doc) => {
          const Icon = doc.icon;
          const isActive = activeDoc === doc.id;
          return (
            <button
              key={doc.id}
              onClick={() => setActiveDoc(doc.id)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                isActive
                  ? 'bg-slate-800 text-white font-semibold shadow border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
              <span>{doc.label}</span>
            </button>
          );
        })}
      </div>

      {/* Document Content Display */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 shadow-sm">
        <pre className="whitespace-pre-wrap font-sans text-xs text-slate-200 leading-relaxed max-w-4xl overflow-x-auto">
          {docContents[activeDoc]}
        </pre>
      </div>
    </div>
  );
};
