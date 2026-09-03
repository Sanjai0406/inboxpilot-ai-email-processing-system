# InboxPilot Test Cases

| #  | Scenario                           | Expected Result                                      |
| -- | ---------------------------------- | ---------------------------------------------------- |
| 1  | Billing question                   | Classified as Billing and routed appropriately       |
| 2  | Technical support issue            | Classified as Technical Support                      |
| 3  | Sales inquiry                      | Classified as Sales                                  |
| 4  | Ambiguous email                    | Low confidence / Human Review                        |
| 5  | Email missing required information | Missing information identified and user asked for it |
| 6  | Urgent complaint                   | High urgency identified without bypassing safety     |
| 7  | Low-confidence classification      | Human Review                                         |
| 8  | Financial/high-impact request      | Human approval required                              |
| 9  | Malformed LLM response             | Validation failure handled safely                    |
| 10 | LLM/API failure                    | Retry attempted and failure recorded                 |
| 11 | Human correction                   | Original and corrected classification stored         |
| 12 | Similar future email               | Previous correction used as feedback context         |

## Detailed Examples

### Test 1 — Billing

**Input:** Customer asks why they were charged twice.

**Expected:**
Intent = Billing
Action = Route to Billing / Provide Information depending on available details.

### Test 4 — Ambiguous Request

**Input:** "Please fix this for me."

**Expected:**
The system should not guess the intent. It should identify insufficient context and route to Human Review or request more information.

### Test 8 — High-Impact Financial Request

**Input:** Customer requests a refund or another financial action.

**Expected:**
The system can recommend the action but must not execute it automatically. Human approval is required.

### Test 11 — Human Correction

**Initial AI Result:** General Support

**Human Correction:** Billing

**Expected:**
The correction is stored as feedback memory.

### Test 12 — Similar Future Email

**Input:** Another email describing a duplicate charge.

**Expected:**
The system can use the previous Billing correction as additional context while still applying confidence and safety rules.

## Failure Testing

The system should also be tested with:

* API unavailable
* Timeout
* Invalid structured output
* Processing failure
* Storage failure
* Maximum retry limit reached

Failures should not result in unintended actions.
