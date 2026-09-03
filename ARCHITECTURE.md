# InboxPilot Architecture

## High-Level Flow

```text
┌─────────────────┐
│ Incoming Email  │
└────────┬────────┘
         ↓
┌─────────────────┐
│ Email Processing │
└────────┬────────┘
         ↓
┌─────────────────┐
│   LLM Analysis  │
│ Intent / Details│
│ Urgency / Missing│
└────────┬────────┘
         ↓
┌──────────────────────┐
│ Structured Validation│
└──────────┬───────────┘
           ↓
┌─────────────────┐
│ Decision Engine │
└────────┬────────┘
         ↓
┌──────────────────┐
│ Safety Guardrails│
└────────┬─────────┘
         ↓
    ┌────┴─────┐
    ↓          ↓
Safe/Low     Human
Risk Action   Review
                 ↓
          Final Outcome
                 ↓
            Audit Log
```

## Feedback Loop

```text
Human Correction
       ↓
Human Feedback
       ↓
Feedback Memory
       ↓
Similar Future Email
       ↓
Feedback-Informed Suggestion
```

Safety guardrails and human approval requirements remain active even when feedback memory is used.

## Component Responsibilities

### 1. Email Processing

Receives and normalizes incoming email information before analysis.

### 2. LLM Analysis

Extracts:

* Intent
* Important details
* Urgency
* Missing information
* Confidence
* Reasoning summary

The LLM is used for understanding, not direct execution.

### 3. Structured Output Validation

Validates the AI response against the expected structure and prevents malformed output from reaching the decision engine.

### 4. Decision Engine

Uses deterministic rules to select the recommended next action.

Examples:

* Provide Information
* Ask for Missing Information
* Route to Billing
* Route to Technical Support
* Route to Sales
* Human Review
* Recommend Refund
* Recommend Cancellation
* Unable to Determine

### 5. Safety Guardrails

Routes high-impact, sensitive, low-confidence, or irreversible operations to human review.

### 6. Human Review

A reviewer can approve, reject, or request additional information.

### 7. Feedback Memory

Stores human corrections and uses relevant historical corrections as additional context for similar future emails.

### 8. Reliability and Audit

Processing attempts, failures, retries, decisions, human corrections, and final outcomes are recorded for traceability.
