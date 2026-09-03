# Design Decisions, Limitations and Production Improvements

## Design Decisions

### LLM for Understanding, Not Execution

The LLM is responsible for understanding the email and extracting structured information. It does not directly execute business actions.

This reduces the risk of hallucinated or unintended actions.

### Deterministic Decision Engine

The final action recommendation is handled by deterministic rules rather than allowing the LLM to freely decide and execute actions.

This makes important business rules easier to test and control.

### Explicit Missing Information

The system explicitly identifies missing information instead of allowing the AI to fill gaps with assumptions.

### Confidence-Based Human Review

Low-confidence results are routed to human review rather than being treated as reliable classifications.

### Human Approval for High-Impact Actions

Financial, sensitive, account-changing, data-deletion, or irreversible actions require human approval.

### Feedback Memory Instead of Retraining

Human corrections are stored as lightweight feedback memory. This provides a simple improvement loop without requiring model fine-tuning or retraining.

### Retry Limits

Transient failures can be retried, but retries are bounded to prevent infinite processing loops.

### Auditability

Important processing events are recorded so that decisions and failures can be traced.

## Limitations

* The application uses synthetic/sample email data.
* LLM responses may vary between requests.
* Feedback memory is not model training.
* External business actions are simulated.
* The assessment version does not provide full enterprise authentication and authorization.

## Production Improvements

If deployed in production, I would add:

1. Enterprise authentication and role-based access control.
2. Real email provider integration.
3. Stronger input/output validation.
4. Centralized logging and distributed tracing.
5. Monitoring and alerting for model/API failures.
6. Rate limiting and cost controls.
7. Data retention and privacy policies.
8. Encryption and secure secret management.
9. A larger evaluation dataset with measurable precision/recall and routing accuracy.
10. Human-review analytics and feedback quality monitoring.
11. Idempotency and stronger workflow state management.
12. Automated regression testing for prompt/model changes.

## Key Principle

The main design principle is:

**AI proposes and understands; deterministic rules validate and decide; safety controls restrict risky actions; humans remain the final authority for high-impact decisions.**
