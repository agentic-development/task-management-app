---
charter: foundation
status: draft
risk_level: low
created: 2026-03-22
title: Draft Spec For Testing
author: e2e-test
---

# Live Spec: Draft Spec For Testing

This spec intentionally stays in `draft` status. It is used by e2e tests to verify that pre-execution gates reject non-reviewed specs.

## Behavioral Contract

### Preconditions
- None

### Behaviors
1. **When** this spec is used **then** pre-execution gates should reject it because it is not `review-passed`.

### Postconditions
- N/A

## Acceptance Criteria
- [ ] This spec should never pass pre-execution gates
