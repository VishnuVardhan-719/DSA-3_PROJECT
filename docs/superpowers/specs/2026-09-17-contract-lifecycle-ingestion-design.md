# Contract Lifecycle and Document Ingestion Design

Date: 2026-09-17
Status: Approved direction; implementation pending written-spec review

## Purpose

Turn the existing local contract-intelligence demonstration into a usable data-management workflow. Users must be able to create and maintain contract records, add versions from structured input or supported documents, edit clauses and obligation mappings, manage reviewers, and navigate real server-side result pages. The existing handwritten search, alignment, similarity, set-cover, graph, and assignment algorithms remain authoritative and continue to operate on persisted data.

This subsystem deliberately stops before authentication, cloud deployment, external OCR, email notifications, and legal certification. Those require separate security and operational designs.

## Baseline and repository strategy

The GitHub repository currently contains only the project abstract, presentation PDF, and a one-line README. The verified application exists at `C:\2ND YEAR ODD SEM\PROJECTS\DSA\Project` and contains the React frontend, FastAPI backend, deterministic SQLite seed, handwritten algorithms, and tests.

Implementation will copy that application into this repository on the `codex/contract-lifecycle-ingestion` branch while preserving the existing academic documents. Generated files, virtual environments, dependency folders, build output, uploads, and SQLite databases will remain ignored. No history on `main` will be rewritten.

## Compatibility boundary

The active interpreter must remain Python 3.14.4. Before adding packages, installation will be preceded by a resolver-only compatibility check using that interpreter. The initial dependency candidates are:

- Alembic for schema migrations
- `python-multipart` for bounded multipart uploads
- `pypdf` for text-bearing PDF extraction
- `python-docx` for DOCX extraction

Exact versions will be pinned only after resolution and import checks succeed under Python 3.14.4. A failed compatibility check stops installation; Python will not be replaced, switched, or downgraded.

## Domain behavior

### Contracts

Users can create contracts, edit metadata, archive records, and restore archived records. Archiving is used instead of destructive deletion because versions, reviews, assignments, and audit history reference contracts. Contract identifiers remain stable and client-supplied identifiers are rejected when duplicated.

Required fields are name, type, owner, department, effective date, and compliance state. Optional fields include counterparty, expiry date, jurisdiction, description, and tags. Updates use an `updatedAt` concurrency token. A stale update returns HTTP 409 rather than silently overwriting newer data.

### Versions and ingestion

A contract version can be created in either of two ways:

1. Structured creation with label, effective date, summary, and manually supplied clauses.
2. Upload of one `.pdf`, `.docx`, or `.txt` document.

Uploads are limited to 10 MiB, validated by extension and detected content signature where available, assigned a server-generated storage name, and stored under an ignored local data directory. Original filenames are metadata only and never become filesystem paths. A SHA-256 digest prevents duplicate ingestion for the same contract.

Text extraction is deterministic and local:

- TXT: UTF-8 with explicit validation.
- DOCX: ordered paragraphs and table-cell text.
- PDF: text extracted from text-bearing pages.

Empty extracted text is rejected with a structured `document_text_unavailable` error. Scanned PDFs are not presented as successfully processed; the UI explains that OCR is not configured. Raw extracted text is retained with the version for traceability.

### Clause segmentation

The ingestion service divides text using deterministic legal-heading rules: numbered headings, article/section headings, and all-caps headings with bounded length. Text before the first heading becomes a preamble clause. If no reliable heading is found, the document becomes one explicitly labelled `Full document text` clause rather than fabricated semantic clauses.

Generated stable clause keys are version-local during ingestion and can subsequently be corrected by the user. Editing clause text or keys records an audit event and triggers rebuilding of derived search data on the next query. No LLM or semantic extraction service is introduced.

### Clauses and obligations

Users can create, edit, archive, and restore clauses. Obligation mappings can be added or removed from a clause. Obligation records can be created and edited, but an obligation referenced by clauses is archived rather than deleted. Compliance coverage uses only active clauses and obligations unless the caller explicitly requests archived data.

### Reviewers

Users can create reviewers, edit expertise and capacity, and deactivate or reactivate reviewers. Deactivated reviewers remain visible in historical assignments but are excluded from new min-cost max-flow proposals. Capacity cannot be set below the number of confirmed active assignments; attempts return HTTP 409.

## API design

Existing read and analysis routes remain compatible. New mutation routes are:

- `POST /contracts`
- `PATCH /contracts/{contract_id}`
- `POST /contracts/{contract_id}/archive`
- `POST /contracts/{contract_id}/restore`
- `POST /contracts/bulk-actions`
- `POST /contracts/{contract_id}/versions`
- `POST /contracts/{contract_id}/versions/upload`
- `PATCH /versions/{version_id}`
- `POST /versions/{version_id}/archive`
- `POST /versions/{version_id}/clauses`
- `PATCH /clauses/{clause_id}`
- `POST /clauses/{clause_id}/archive`
- `POST /clauses/{clause_id}/restore`
- `PUT /clauses/{clause_id}/obligations`
- `POST /obligations`
- `PATCH /obligations/{obligation_id}`
- `POST /obligations/{obligation_id}/archive`
- `POST /reviewers`
- `PATCH /reviewers/{reviewer_id}`
- `POST /reviewers/{reviewer_id}/deactivate`
- `POST /reviewers/{reviewer_id}/reactivate`

Bulk contract actions initially support archive, restore, and compliance-state change. They are atomic: validation failure leaves every selected contract unchanged.

List endpoints accept `page`, `pageSize`, `query`, `sort`, `direction`, and entity-specific filters. `pageSize` is restricted to 1–100. Responses retain `{ items, page, pageSize, total, totalPages }`. Invalid filters use HTTP 422; missing records use 404; stale writes, duplicates, and invalid state transitions use 409. Every mutation writes an append-only audit event in the same database transaction.

## Persistence and migrations

Alembic becomes the schema authority. Startup verifies that the database is at the expected revision and reports a direct setup error when it is not. It does not silently mutate a production-shaped database through `create_all`.

The initial migration represents the existing schema plus new lifecycle fields, document metadata, extracted source text, archive state, timestamps, and concurrency tokens. Reset/seed commands recreate and migrate the local database before inserting deterministic demo data. SQLite remains the supported local database for this phase; model definitions avoid SQLite-only constructs so PostgreSQL migration remains possible later.

## Frontend experience

The current restrained enterprise visual system remains intact. New behavior is integrated into existing routes rather than adding disconnected dashboards.

- Contract register: working Previous/Next controls, page-size selection, server-side search/filter/sort, row selection, and bulk action bar.
- Contract creation: focused modal or drawer with validated metadata fields.
- Contract detail: edit/archive/restore controls and visible lifecycle state.
- Versions: create-version form plus drag-and-drop/file-picker upload with size/type guidance and extraction errors.
- Clauses: inline edit drawer for title, stable key, position, status, text, tags, and obligations.
- Reviewers: create/edit/deactivate controls with capacity-conflict feedback.

Mutation forms keep user input after recoverable API errors. Success messages name the affected record. Destructive-looking archive actions require confirmation and explain that restoration remains available. Keyboard focus is moved into opened dialogs and returned to the invoking control on close.

## Client data flow

The existing typed fetch client remains the single transport layer. Resource hooks receive explicit page/filter state and abort superseded requests. Mutations update or reload only the affected resource. Uploaded files use `FormData`; JSON mutations remain JSON. There is no fake API fallback and no duplicated demo-state store.

Display density remains browser-local. Domain records and workflow state persist through the backend.

## Testing strategy

Development follows red-green-refactor behavior by behavior.

Backend tests cover:

- CRUD validation, conflicts, archive/restore, and stale concurrency tokens
- atomic bulk actions
- upload size/type/signature validation and safe filenames
- TXT, DOCX, and text-PDF extraction
- scanned/empty-document rejection
- deterministic segmentation and fallback behavior
- duplicate document digests
- clause-obligation updates
- reviewer capacity and deactivation constraints
- audit creation and transaction rollback
- pagination boundaries, filters, sort order, and invalid parameters
- migration and deterministic reset/seed behavior

Frontend tests use Vitest, Testing Library, and jsdom for pagination state, form validation, recoverable errors, bulk selection, archive confirmation, and upload feedback. A small Playwright suite covers the critical browser workflows: create a contract, add/upload a version, edit a clause, paginate the register, archive/restore the contract, and manage a reviewer. Browser dependencies will be installed only when compatible with the existing Node environment.

Final verification requires backend tests, migration/reset checks, frontend tests, lint, TypeScript checking, production build, live API smoke tests, and desktop/mobile route inspection.

## Security and operational constraints

- Upload paths are server-generated and restricted to the configured upload directory.
- Files exceeding limits are rejected before extraction.
- Documents are never executed, rendered as HTML, or sent externally.
- Extracted text is treated as untrusted content and rendered as text.
- CORS remains explicit and local by default.
- No authentication claim is made; the README must warn that the service is not safe for an untrusted network until the later identity phase.

## Documentation and deliverables

The repository README will replace the one-line placeholder and document architecture, Python 3.14 compatibility checks, installation, migration, seed/reset, test, run, upload limits, supported file types, algorithm behavior, and current limitations. Existing academic PDFs remain available. The completed feature branch will contain reviewable commits grouped by baseline import, backend lifecycle, ingestion, frontend workflows, tests, and documentation.

## Explicitly deferred work

- Authentication, RBAC, tenancy, and identity-provider integration
- PostgreSQL deployment and production connection management
- OCR for image-only documents
- Email, scheduled notifications, and background workers
- Cloud storage, external regulatory feeds, AI/LLM processing, and legal certification
- Production observability, backups, penetration testing, and compliance audits

These are not hidden placeholders in the current subsystem. Each needs a separate threat model and deployment design after the core contract lifecycle is stable.
