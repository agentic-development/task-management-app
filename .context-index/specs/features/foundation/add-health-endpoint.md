---
charter: foundation
status: review-passed
risk_level: low
milestone: v1
created: 2026-03-22
title: Add Health Check Endpoint
author: e2e-test
---

# Live Spec: Add Health Check Endpoint

## Behavioral Contract

### Preconditions

- Next.js App Router is set up at `src/app/`

### Behaviors

1. **When** a GET request is made to `/api/health` **then** a JSON response is returned with `{ status: "ok", timestamp: "<ISO string>" }` and HTTP status 200.

2. **When** the health endpoint is called **then** the response includes a `Content-Type: application/json` header.

### Postconditions

- The `/api/health` endpoint is available and returns a 200 status

### Error Cases

| Condition | Expected Behavior | HTTP Status |
|-----------|-------------------|-------------|
| None expected | N/A | N/A |

## Acceptance Criteria

- [x] GET /api/health returns `{ status: "ok", timestamp: "..." }` with HTTP 200
- [x] Response has Content-Type: application/json
