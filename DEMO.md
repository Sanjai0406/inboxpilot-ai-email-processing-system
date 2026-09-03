# Step-by-Step 5–10 Minute Walkthrough Demo

This guide walks an evaluator through the core capabilities of **InboxPilot**.

---

### Step 1: Open Dashboard
- View total processed volume, auto-completed counts, human review queues, safety block tallies, and average latency.
- Review the live pipeline visualizer and recent activity stream.

### Step 2: Open Inbox
- Observe pre-seeded synthetic emails covering Billing, Technical Support, Sales, Urgent Complaints, Missing Info, and Refunds.
- Notice status tags: `RECEIVED`, `PROCESSING`, `COMPLETED`, `HUMAN_REVIEW`.

### Step 3: Process a Normal Email
- Select **Email #101** (*"Invoice #INV-2026-8849 Payment Verification"*).
- Click **"Process Email"**.
- Watch the live step-by-step pipeline execution:
  `Received` $\rightarrow$ `Validating` $\rightarrow$ `LLM Analysis (Gemini)` $\rightarrow$ `Validation` $\rightarrow$ `Decision Engine` $\rightarrow$ `Safety Guardrails` $\rightarrow$ `Completed`.
- Observe that it was classified as **Billing**, evaluated as **Low Risk**, and automatically routed to **Route to Billing** with 0 human review needed.

### Step 4: Process Ambiguous / Missing-Information Email
- Select **Email #105** (*"Help regarding my issue - It is still not working right"*).
- Click **"Process Email"**.
- Observe that Gemini identifies missing context (`missingInformation: ['Specific product or service name', 'Error logs']`), flags confidence $< 0.70$, and routes it to **Human Review Queue**.

### Step 5: Process High-Impact Financial Request (Refund)
- Select **Email #106** (*"Need refund for my subscription renewal - $299/yr"*).
- Click **"Process Email"**.
- Observe the **Safety Guardrail Triggered**:
  `[CRITICAL] REFUND_REQUEST: Request involves financial transactions. Automated execution is prohibited.`
- The decision engine outputs **"Recommend Refund"** with `requiresHumanApproval: true`.

### Step 6: Perform Human Review & Approval
- Navigate to the **Human Review** tab.
- Select the pending refund email.
- Inspect the side-by-side view: Original Email, AI Understanding, Triggered Safety Flags.
- Click **"Approve Action (Simulated)"** with a note: *"Customer within 24h grace period. Approved."*
- Notice the resolution updates the audit log and moves the email to `COMPLETED` state.

### Step 7: Demonstrate Human Feedback Loop & Memory
- Navigate to **Feedback & Corrections**.
- Observe the pre-registered memory for **"charged twice"** corrections.
- Select **Email #110** (*"I was charged twice on my card. Please check."*).
- Click **"Process Email"**.
- Observe that the system identifies the historical correction, displays the **Feedback-Informed Suggestion** (suggesting *Billing* instead of *General Support*), while the **Safety Guardrails remain 100% active**!

### Step 8: View Processing History & Audit Logs
- Navigate to **Processing History** to view the waterfall execution timeline and retry breakdowns.
- Open the Audit Log to see immutable, sanitized records of each event.

### Step 9: Run Automated Test Suite
- Navigate to the **Test Cases** tab.
- Click **"Run All 12 Test Cases"**.
- Observe real-time execution and 100% green verification.

### Step 10: Inspect System Health & Configurable Limits
- Navigate to **System Health** to inspect the LLM gateway connection, average latencies, and adjust limits (`MAX_RETRIES`, `MAX_EMAIL_LENGTH`, etc.).
