# Test Suite Specifications & Verification Matrix

## Automated Test Scenarios

The InboxPilot system includes 12 automated test scenarios designed to validate AI understanding, deterministic logic, retry resilience, safety guardrails, and the human feedback loop.

| # | Test Scenario | Category | Input Payload | Expected Behavior | Safety Flag |
| :- | :--- | :--- | :--- | :--- | :--- |
| **01** | **Normal Billing Email** | Classification | Wire payment inquiry with invoice ID & amount | Classifies as `Billing`, routes to `Route to Billing`, risk `Low`, auto-completes without human review. | None |
| **02** | **Technical Support Email** | Classification | API HTTP 500 error log with trace ID | Classifies as `Technical Support`, routes to `Route to Technical Support`, risk `Low`. | None |
| **03** | **Enterprise Sales Lead** | Classification | 200-seat license expansion quote request | Classifies as `Sales`, routes to `Route to Sales`, risk `Low`. | None |
| **04** | **Ambiguous Request** | Safety & Guardrails | "It is not working right. Can you fix it?" | Low confidence / `Unknown` intent, escalates to `Human Review`. | `UNKNOWN_INTENT` / `LOW_CONFIDENCE` |
| **05** | **Missing Information** | Safety & Guardrails | "Issue with recent invoice" (no ID) | Detects missing invoice identifier, recommends `Ask for Missing Information`. | `MISSING_INFO` |
| **06** | **Urgent Complaint** | Safety & Guardrails | Outage during client demo, critical urgency | Classifies as `Complaint`, urgency `Critical`, escalates to `Human Review`. | `HIGH_IMPACT_COMPLAINT` |
| **07** | **Low-Confidence AI** | Safety & Guardrails | Ambiguous prompt resulting in confidence $< 0.70$ | Blocks automated routing, requires human review. | `LOW_CONFIDENCE` |
| **08** | **High-Impact Refund** | Safety & Guardrails | "$299 refund for subscription renewal" | Flags `REFUND_REQUEST`, sets risk `Critical`, blocks payout, requires `Human Approval`. | `REFUND_REQUEST` |
| **09** | **LLM Gateway Failure** | Reliability & Retries | Simulated 503 AI API timeout | Executes 3 retries with backoff; on failure, escalates to `Human Review`. | `AI_MALFUNCTION` |
| **10** | **Malformed AI Response** | Reliability & Retries | Corrupted JSON output missing required fields | Trapped by schema validator; retries and safely escalates to `Human Review`. | `UNKNOWN_INTENT` |
| **11** | **Human Correction** | Feedback Loop | Reviewer corrects intent from General Support to Billing | Creates auditable `HumanFeedback` & `FeedbackMemory` without claiming model retraining. | None |
| **12** | **Feedback Memory Match** | Feedback Loop | "I was charged twice on my card" | Matches previous "charged twice" memory, suggests `Route to Billing` while keeping safety active! | `REFUND_REQUEST` |

---

## Running the Automated Test Suite

### Via User Interface
Navigate to the **Test Cases** tab in the web application and click **"Run All 12 Test Cases"**. Real-time execution stats, step timings, and verified pass/fail badges will render immediately.

### Via API Endpoint
```bash
curl http://localhost:3000/api/test-cases/run
```
