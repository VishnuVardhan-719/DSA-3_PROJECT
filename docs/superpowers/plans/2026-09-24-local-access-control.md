# Local Access Control Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a local authenticated-actor boundary, role checks for mutations, and immutable actor attribution to audit events.

**Architecture:** A seeded `users` table supplies local identities selected by the `X-Actor-Id` header. FastAPI dependencies resolve an active user and enforce a role allowlist on mutation routes; lifecycle helpers persist actor ID and role with each append-only audit event. The browser client sends its persisted local actor ID.

**Tech Stack:** FastAPI 0.141.1, SQLAlchemy 2.0.54, SQLite, Pydantic 2.13.5, React 19, TypeScript, Pytest, Vitest.

**Spec:** `README.md`

## Global Constraints

- Do not add dependencies; use installed FastAPI, SQLAlchemy, and browser localStorage.
- Preserve camelCase API responses and `{ error: { code, message, details? } }` error envelopes.
- Preserve existing uncommitted work outside this feature.
- This is local identity attribution, not password, token, or production session authentication.

---

### Task 1: Persist and resolve local actors

**Files:**
- Modify: `backend/app/models.py`, `backend/app/seed.py`, `backend/app/services/lifecycle.py`
- Create: `backend/app/services/access.py`
- Test: `backend/tests/test_access_control.py`

**Interfaces:**
- Produces `get_current_actor()` and `require_roles(*roles)` dependencies.
- Produces audit events with `actor`, `actor_role`, and stable `actor_id`.

- [ ] Write tests for missing, unknown, inactive, and role-restricted actor headers.
- [ ] Add a seeded local administrator and reviewer identities.
- [ ] Resolve `X-Actor-Id` to an active user, returning standard 401/403 API errors.
- [ ] Record the resolved actor rather than client payload text in audit events.

### Task 2: Enforce authorization at all mutation boundaries

**Files:**
- Modify: `backend/app/api/contracts.py`, `backend/app/api/clauses.py`, `backend/app/api/obligations.py`, `backend/app/api/reviewers.py`, `backend/app/api/versions.py`, `backend/app/main.py`
- Test: `backend/tests/test_access_control.py`

**Interfaces:**
- Consumes `models.User` from `get_current_actor` and `require_roles`.
- Produces 401 for a missing actor and 403 for a recognized actor without a permitted role.

- [ ] Require a local actor for each state-changing route.
- [ ] Allow administrators to manage contracts, clauses, obligations, reviewers, and assignments.
- [ ] Allow legal reviewers to perform review/content operations but not manage reviewer identities.
- [ ] Replace hard-coded audit actor names with the resolved actor in every affected route.

### Task 3: Connect the browser and document the local boundary

**Files:**
- Modify: `src/api/client.ts`, `README.md`, `memory-bank/activeContext.md`, `memory-bank/progress.md`
- Test: `src/api/client.test.ts` or an existing client-level test if present.

**Interfaces:**
- Browser requests send `X-Actor-Id`, defaulting to seeded `USR-001`.
- A developer may override it with `localStorage.contractWorkspaceActorId`.

- [ ] Send the stored local actor ID with every API request.
- [ ] Document identities, roles, and the non-production limitation.
- [ ] Update task context and progress records after code validation.

### Task 4: Verify the complete slice

**Files:**
- Verify only.

- [ ] Run `Set-Location backend; ..\.venv\Scripts\python.exe -m pytest -q`.
- [ ] Run `npm run typecheck`, `npm run lint`, and `npm test -- --run`.
- [ ] Run `npm run build` because the API client is used by the UI.