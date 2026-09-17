# Contract Lifecycle and Document Ingestion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Import the verified application into this repository and add editable contract lifecycle workflows, safe local document ingestion, real server-side pagination, migrations, and automated frontend/browser tests.

**Architecture:** Preserve the existing React/FastAPI boundaries and handwritten algorithms. Add focused SQLAlchemy service modules for lifecycle mutations and ingestion, use Alembic as schema authority, and extend the single typed frontend client rather than creating parallel state or API layers.

**Tech Stack:** Python 3.14.4, FastAPI 0.141.1, SQLAlchemy 2.0.54, Pydantic 2.13.5, Alembic 1.20.0, SQLite, pypdf 6.19.0, python-docx 1.2.0, React 19, TypeScript 6, Vite 8, Vitest 5, Testing Library 16, Playwright 1.63.

**Spec:** `docs/superpowers/specs/2026-09-17-contract-lifecycle-ingestion-design.md`

## Global Constraints

- Keep the active interpreter exactly Python 3.14.4; never install, switch, or downgrade Python.
- Run the dependency resolver dry run again immediately before installation and stop if it fails.
- Preserve the exact assignment objective: **maximize valid assignments first, then minimize workload/expertise cost**.
- Do not add authentication, cloud services, external OCR, email, LLM processing, or legal-certification claims.
- Every mutation and bug fix follows red-green-refactor and writes an audit event in the same transaction.
- Uploaded files stay below 10 MiB, use server-generated paths, and never render as HTML.
- Preserve the existing academic PDFs and Git history.

## Target file structure

- `backend/app/api/`: route modules grouped by contracts, versions, clauses, obligations, and reviewers.
- `backend/app/services/lifecycle.py`: transactional archive, restore, bulk action, and concurrency rules.
- `backend/app/services/ingestion.py`: file validation, hashing, extraction, and deterministic segmentation.
- `backend/app/services/identifiers.py`: deterministic next-ID generation for local records.
- `backend/alembic/`: migrations and environment configuration.
- `src/features/contracts/`: register pagination, editor, lifecycle actions, and version upload.
- `src/features/clauses/`: clause editor and obligation mapping controls.
- `src/features/reviewers/`: reviewer editor and lifecycle controls.
- `src/test/`: frontend test setup and shared render helpers.
- `e2e/`: Playwright critical-workflow tests.

---

### Task 1: Import and verify the existing application baseline

**Files:**
- Copy: application files from `C:\2ND YEAR ODD SEM\PROJECTS\DSA\Project`
- Preserve: `Abstract/`, `Abstract.pdf`, `Contract_Compliance_PPT.pdf`
- Create: `.gitignore`
- Modify: `README.md`

**Interfaces:**
- Consumes: the verified local React/FastAPI application.
- Produces: a clean repository baseline whose commands and API behavior match the source workspace.

- [ ] **Step 1: Copy only source-controlled application material**

Use PowerShell `Copy-Item` for `backend/app`, `backend/tests`, `backend/docs`, `src`, and individual root configuration files. Do not copy `.venv`, `node_modules`, `dist`, caches, or `backend/data/contracts.db`.

- [ ] **Step 2: Add repository exclusions**

```gitignore
.venv/
backend/.venv/
node_modules/
dist/
__pycache__/
.pytest_cache/
.coverage
backend/data/*.db
backend/data/uploads/
test-results/
playwright-report/
```

- [ ] **Step 3: Recreate the verified environments without changing Python**

Run:

```powershell
C:\Python314\python.exe --version
C:\Python314\python.exe -m venv .venv
.\.venv\Scripts\python.exe --version
npm ci
```

Expected: both Python commands report `Python 3.14.4`; npm completes from the imported lockfile.

- [ ] **Step 4: Verify baseline parity**

Run:

```powershell
.\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
Push-Location backend; ..\.venv\Scripts\python.exe -m pytest -q; Pop-Location
npm run lint
npm run typecheck
npm run build
```

Expected: 17 backend tests pass and all three frontend gates exit 0.

- [ ] **Step 5: Commit**

```powershell
git add . ':!docs/superpowers'
git commit -m "feat: import verified contract intelligence baseline"
```

### Task 2: Establish migrations and lifecycle schema

**Files:**
- Modify: `backend/requirements.txt`
- Modify: `backend/app/models.py`
- Modify: `backend/app/database.py`
- Modify: `backend/app/seed.py`
- Create: `backend/alembic.ini`
- Create: `backend/alembic/env.py`
- Create: `backend/alembic/versions/0001_contract_lifecycle.py`
- Create: `backend/tests/test_migrations.py`

**Interfaces:**
- Consumes: `app.database.Base`, existing SQLAlchemy models, `DATABASE_URL`.
- Produces: `run_migrations(database_url: str | None = None) -> None`, lifecycle columns, and migration-aware reset/seed behavior.

- [ ] **Step 1: Write failing migration tests**

```python
def test_upgrade_creates_lifecycle_columns(tmp_path):
    url = f"sqlite:///{tmp_path / 'migration.db'}"
    run_migrations(url)
    columns = inspect(create_engine(url)).get_columns("contracts")
    assert {column["name"] for column in columns} >= {
        "archived_at", "updated_at", "counterparty", "jurisdiction", "description"
    }

def test_seed_after_migration_is_deterministic(tmp_path):
    first = reset_and_seed(f"sqlite:///{tmp_path / 'seed.db'}")
    second = reset_and_seed(f"sqlite:///{tmp_path / 'seed.db'}")
    assert first == second == {"contracts": 12, "versions": 36, "clauses": 276,
                               "obligations": 10, "reviewers": 6}
```

- [ ] **Step 2: Verify the tests fail for missing migration support**

Run: `cd backend; ..\.venv\Scripts\python.exe -m pytest tests/test_migrations.py -q`

Expected: FAIL because `run_migrations` and lifecycle columns do not exist.

- [ ] **Step 3: Repeat compatibility dry run and install exact pins**

Run:

```powershell
.\.venv\Scripts\python.exe -m pip install --dry-run --only-binary=:all: alembic==1.20.0 python-multipart==0.0.32 pypdf==6.19.0 python-docx==1.2.0
.\.venv\Scripts\python.exe -m pip install alembic==1.20.0 python-multipart==0.0.32 pypdf==6.19.0 python-docx==1.2.0
```

Append those four exact pins to `backend/requirements.txt` only after the dry run succeeds.

- [ ] **Step 4: Add lifecycle schema and migration runner**

Add nullable archive timestamps and non-null `updated_at` timestamps to contracts, versions, clauses, obligations, and reviewers. Add contract metadata fields; add version `source_filename`, `source_sha256`, `source_media_type`, and `source_text`; add reviewer `active`. Implement:

```python
def run_migrations(database_url: str | None = None) -> None:
    config = Config(str(BACKEND_ROOT / "alembic.ini"))
    config.set_main_option("sqlalchemy.url", database_url or current_database_url())
    command.upgrade(config, "head")
```

Make `reset_and_seed()` delete the explicit local DB path, run migrations, and then seed.

- [ ] **Step 5: Verify migration and existing tests**

Run: `cd backend; ..\.venv\Scripts\python.exe -m pytest tests/test_migrations.py tests/test_api.py tests/test_algorithms.py -q`

Expected: all tests pass.

- [ ] **Step 6: Commit**

```powershell
git add backend
git commit -m "feat: add migration-backed lifecycle schema"
```

### Task 3: Implement contract lifecycle, concurrency, and atomic bulk actions

**Files:**
- Create: `backend/app/services/__init__.py`
- Create: `backend/app/services/identifiers.py`
- Create: `backend/app/services/lifecycle.py`
- Create: `backend/app/api/__init__.py`
- Create: `backend/app/api/contracts.py`
- Modify: `backend/app/schemas.py`
- Modify: `backend/app/main.py`
- Create: `backend/tests/test_contract_lifecycle.py`

**Interfaces:**
- Consumes: SQLAlchemy `Session`, `Contract`, and existing structured error handler.
- Produces: `next_identifier(session, model, prefix, width)`, `archive_contract`, `restore_contract`, `bulk_update_contracts`, and typed contract mutation routes.

- [ ] **Step 1: Write failing create/update/conflict tests**

```python
def test_create_and_update_contract(client):
    created = client.post("/contracts", json=contract_payload("Lifecycle Test")).json()
    response = client.patch(f"/contracts/{created['id']}", json={
        "owner": "Updated Owner", "updatedAt": created["updatedAt"]
    })
    assert response.status_code == 200
    assert response.json()["owner"] == "Updated Owner"

def test_stale_contract_update_returns_conflict(client):
    created = client.post("/contracts", json=contract_payload("Concurrency Test")).json()
    client.patch(f"/contracts/{created['id']}", json={
        "owner": "First", "updatedAt": created["updatedAt"]
    })
    stale = client.patch(f"/contracts/{created['id']}", json={
        "owner": "Second", "updatedAt": created["updatedAt"]
    })
    assert stale.status_code == 409
    assert stale.json()["error"]["code"] == "stale_record"
```

- [ ] **Step 2: Verify RED**

Run: `cd backend; ..\.venv\Scripts\python.exe -m pytest tests/test_contract_lifecycle.py -q`

Expected: FAIL with 405 or missing routes.

- [ ] **Step 3: Implement create, patch, archive, and restore**

Use Pydantic models `ContractCreate`, `ContractUpdate`, and `ContractView`. Compare timezone-naive UTC `updated_at` exactly. Archive/restore set or clear `archived_at`, update `updated_at`, and append audit events before one commit.

- [ ] **Step 4: Verify lifecycle tests pass**

Run the Task 3 test file and expect PASS.

- [ ] **Step 5: Write failing atomic bulk-action test**

```python
def test_bulk_action_rolls_back_when_any_contract_is_missing(client):
    before = client.get("/contracts/CTR-001").json()["compliance"]
    response = client.post("/contracts/bulk-actions", json={
        "contractIds": ["CTR-001", "MISSING"], "action": "set_compliance",
        "value": "Exception"
    })
    assert response.status_code == 404
    assert client.get("/contracts/CTR-001").json()["compliance"] == before
```

- [ ] **Step 6: Verify RED, implement the transaction, and verify GREEN**

Load and validate every contract before mutating any record. Support `archive`, `restore`, and `set_compliance`; reject an empty list and duplicate IDs. Run the test before and after implementation.

- [ ] **Step 7: Commit**

```powershell
git add backend/app backend/tests/test_contract_lifecycle.py
git commit -m "feat: add transactional contract lifecycle API"
```

### Task 4: Add real server-side pagination, filters, and sorting

**Files:**
- Modify: `backend/app/api/contracts.py`
- Modify: `backend/app/main.py`
- Modify: `backend/app/schemas.py`
- Create: `backend/tests/test_pagination.py`

**Interfaces:**
- Consumes: `GET /contracts` compatibility response.
- Produces: stable `page`, `pageSize`, `query`, `sort`, `direction`, `compliance`, `department`, and `includeArchived` query behavior.

- [ ] **Step 1: Write failing pagination tests**

```python
def test_contract_pages_are_stable(client):
    first = client.get("/contracts?page=1&pageSize=5&sort=name&direction=asc").json()
    second = client.get("/contracts?page=2&pageSize=5&sort=name&direction=asc").json()
    assert first["total"] == 12 and first["totalPages"] == 3
    assert len(first["items"]) == 5 and len(second["items"]) == 5
    assert {item["id"] for item in first["items"]}.isdisjoint(
        {item["id"] for item in second["items"]})

def test_invalid_page_size_is_structured_422(client):
    response = client.get("/contracts?pageSize=101")
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "validation_error"
```

- [ ] **Step 2: Verify RED, implement query composition, verify GREEN**

Count the filtered query before applying offset/limit. Add contract ID as the final deterministic sort key. Whitelist sort names instead of passing user strings into SQLAlchemy attributes.

- [ ] **Step 3: Add equivalent pagination checks for clauses, reviewers, reviews, assignments, and audit events**

Use the same 1–100 bounds and deterministic secondary ID ordering. Run `tests/test_pagination.py` until all cases pass.

- [ ] **Step 4: Commit**

```powershell
git add backend/app backend/tests/test_pagination.py
git commit -m "feat: add stable server-side list pagination"
```

### Task 5: Implement safe document extraction and deterministic segmentation

**Files:**
- Create: `backend/app/services/ingestion.py`
- Create: `backend/tests/fixtures/sample.txt`
- Create: `backend/tests/fixtures/sample.docx`
- Create: `backend/tests/fixtures/sample.pdf`
- Create: `backend/tests/test_ingestion.py`

**Interfaces:**
- Produces: `validate_upload(filename: str, content: bytes) -> DocumentInput`, `extract_text(document: DocumentInput) -> str`, and `segment_clauses(text: str) -> list[Segment]`.
- `DocumentInput`: frozen dataclass with `filename`, `extension`, `media_type`, `sha256`, and `content`.
- `Segment`: frozen dataclass with `key`, `title`, `text`, and `position`.

- [ ] **Step 1: Write failing validation tests**

```python
def test_rejects_oversized_and_unsupported_uploads():
    with pytest.raises(IngestionError, match="10 MiB"):
        validate_upload("large.txt", b"x" * (10 * 1024 * 1024 + 1))
    with pytest.raises(IngestionError, match="PDF, DOCX, or TXT"):
        validate_upload("payload.exe", b"MZ")

def test_filename_never_controls_storage_path():
    document = validate_upload("../../escape.txt", b"Section 1. Scope\nText")
    assert document.filename == "escape.txt"
    assert "/" not in document.filename and "\\" not in document.filename
```

- [ ] **Step 2: Verify RED, implement bounded validation, verify GREEN**

Use `Path(filename).name`, explicit extension allowlisting, `%PDF-` for PDF, ZIP/DOCX package validation for DOCX, strict UTF-8 for TXT, and `hashlib.sha256`.

- [ ] **Step 3: Write failing extraction and segmentation tests**

```python
def test_segments_numbered_legal_headings():
    segments = segment_clauses("1. Scope\nServices apply.\n2. Liability\nLiability is capped.")
    assert [(s.key, s.title) for s in segments] == [
        ("C01", "Scope"), ("C02", "Liability")
    ]

def test_unstructured_text_becomes_one_traceable_clause():
    segments = segment_clauses("A paragraph without a reliable heading.")
    assert len(segments) == 1
    assert segments[0].title == "Full document text"
```

- [ ] **Step 4: Verify RED, implement extractors and segmentation, verify GREEN**

Extract PDF page text in order, DOCX paragraphs then table cells in document order, and TXT as strict UTF-8. Normalize CRLF and repeated blank lines without changing words. Raise `document_text_unavailable` for empty extraction.

- [ ] **Step 5: Commit**

```powershell
git add backend/app/services/ingestion.py backend/tests
git commit -m "feat: add safe deterministic document ingestion"
```

### Task 6: Add version, clause, and obligation lifecycle APIs

**Files:**
- Create: `backend/app/api/versions.py`
- Create: `backend/app/api/clauses.py`
- Create: `backend/app/api/obligations.py`
- Modify: `backend/app/schemas.py`
- Modify: `backend/app/main.py`
- Create: `backend/tests/test_content_lifecycle.py`

**Interfaces:**
- Consumes: Task 5 ingestion functions and Task 3 audit/concurrency helpers.
- Produces: structured version creation/upload, clause mutations, obligation mutations, and mapping replacement.

- [ ] **Step 1: Write failing structured-version and upload tests**

```python
def test_upload_creates_version_and_segmented_clauses(client):
    response = client.post("/contracts/CTR-001/versions/upload", data={
        "label": "v4.0", "effectiveDate": "2026-10-01", "author": "Legal Ops"
    }, files={"file": ("agreement.txt", b"1. Scope\nServices.\n2. Fees\nFees apply.", "text/plain")})
    assert response.status_code == 201
    body = response.json()
    assert body["sourceFilename"] == "agreement.txt"
    assert [clause["title"] for clause in body["clauses"]] == ["Scope", "Fees"]

def test_duplicate_upload_for_contract_returns_conflict(client):
    document = b"1. Scope\nServices.\n2. Fees\nFees apply."
    first_response = client.post("/contracts/CTR-001/versions/upload", data={
        "label": "v4.0", "effectiveDate": "2026-10-01", "author": "Legal Ops"
    }, files={"file": ("agreement.txt", document, "text/plain")})
    assert first_response.status_code == 201
    second_response = client.post("/contracts/CTR-001/versions/upload", data={
        "label": "v4.1", "effectiveDate": "2026-10-02", "author": "Legal Ops"
    }, files={"file": ("renamed.txt", document, "text/plain")})
    assert second_response.status_code == 409
    assert second_response.json()["error"]["code"] == "duplicate_document"
```

- [ ] **Step 2: Verify RED, implement version routes transactionally, verify GREEN**

Save uploaded bytes only after validation and duplicate-digest checks. If database persistence fails, remove the newly written file. Return created clauses with the version.

- [ ] **Step 3: Write failing clause and obligation tests**

```python
def test_replace_clause_obligations_is_atomic(client):
    response = client.put("/clauses/CLS-001/obligations", json={
        "obligationIds": ["OBL-001", "OBL-002"]
    })
    assert response.status_code == 200
    assert response.json()["obligationIds"] == ["OBL-001", "OBL-002"]

def test_archived_clause_disappears_from_default_search(client):
    client.post("/clauses/CLS-001/archive")
    ids = {item["id"] for item in client.post("/clause-search", json={
        "query": "data", "mode": "OR", "page": 1, "pageSize": 100
    }).json()["items"]}
    assert "CLS-001" not in ids
```

- [ ] **Step 4: Verify RED, implement clause/obligation routes, verify GREEN**

Validate every obligation before replacing mappings. Archive rather than delete. Ensure search, comparison, similarity, and coverage exclude archived records by default.

- [ ] **Step 5: Commit**

```powershell
git add backend/app backend/tests/test_content_lifecycle.py
git commit -m "feat: add version clause and obligation lifecycle"
```

### Task 7: Add reviewer lifecycle and assignment safeguards

**Files:**
- Create: `backend/app/api/reviewers.py`
- Modify: `backend/app/main.py`
- Modify: `backend/app/schemas.py`
- Modify: `backend/app/algorithms/assignment.py`
- Create: `backend/tests/test_reviewer_lifecycle.py`

**Interfaces:**
- Produces: reviewer creation/update/deactivation/reactivation; proposal input includes active reviewers only.

- [ ] **Step 1: Write failing reviewer lifecycle tests**

```python
def test_capacity_cannot_drop_below_confirmed_assignments(client):
    response = client.patch("/reviewers/REV-001", json={"capacity": 0})
    assert response.status_code == 409
    assert response.json()["error"]["code"] == "capacity_conflict"

def test_deactivated_reviewer_is_not_proposed(client):
    client.post("/reviewers/REV-001/deactivate")
    proposal = client.post("/reviewer-assignments/propose", json={
        "contractIds": ["CTR-001"]
    }).json()
    assert all(item["reviewerId"] != "REV-001" for item in proposal["assignments"])
```

- [ ] **Step 2: Verify RED, implement reviewer lifecycle, verify GREEN**

Expertise replacement validates all expertise names before mutation. Deactivation is rejected only when it would invalidate an active confirmed assignment; otherwise historical rows remain intact.

- [ ] **Step 3: Re-run assignment tests and objective assertion**

Run: `cd backend; ..\.venv\Scripts\python.exe -m pytest tests/test_reviewer_lifecycle.py tests/test_algorithms.py tests/test_api.py -q`

Assert OpenAPI still contains the exact phrase `maximize valid assignments first, then minimize workload/expertise cost`.

- [ ] **Step 4: Commit**

```powershell
git add backend/app backend/tests/test_reviewer_lifecycle.py
git commit -m "feat: add reviewer lifecycle safeguards"
```

### Task 8: Add frontend test infrastructure and real contract register pagination

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `vite.config.ts`
- Modify: `src/api/client.ts`
- Modify: `src/types/domain.ts`
- Create: `src/test/setup.ts`
- Create: `src/test/render.tsx`
- Create: `src/features/contracts/ContractRegister.tsx`
- Create: `src/features/contracts/ContractRegister.test.tsx`
- Modify: `src/pages/ContractsPage.tsx`

**Interfaces:**
- Produces: `api.upload<T>(path, formData, signal?)`, `PageResponse<T>`, and controlled `ContractRegister` page/filter state.

- [ ] **Step 1: Install exact frontend test dependencies**

Run:

```powershell
npm install --save-dev --save-exact vitest@5.0.1 @testing-library/react@16.3.3 @testing-library/jest-dom@7.0.1 jsdom@30.1.0 @playwright/test@1.63.0
```

Add scripts `test`, `test:watch`, and `test:e2e`.

- [ ] **Step 2: Write the failing pagination interaction test**

```tsx
it('requests the next server page and renders its records', async () => {
  server.enqueue(pageResponse(1, 5, 12, firstPageContracts))
  server.enqueue(pageResponse(2, 5, 12, secondPageContracts))
  renderApp('/contracts')
  await screen.findByText(firstPageContracts[0].name)
  await userEvent.click(screen.getByRole('button', { name: 'Next page' }))
  expect(await screen.findByText(secondPageContracts[0].name)).toBeVisible()
  expect(server.requests[1].url).toContain('page=2&pageSize=5')
})
```

- [ ] **Step 3: Verify RED**

Run: `npm test -- ContractRegister.test.tsx --run`

Expected: FAIL because the existing controls are disabled and the register fetches 100 records.

- [ ] **Step 4: Implement pagination and upload transport**

Do not set `Content-Type` when the body is `FormData`; let the browser add the multipart boundary. Reset page to 1 when filters or page size change. Disable Previous only on page 1 and Next only on the last page.

- [ ] **Step 5: Verify GREEN and commit**

Run frontend test, lint, and typecheck, then:

```powershell
git add package.json package-lock.json vite.config.ts src
git commit -m "feat: add tested server-paginated contract register"
```

### Task 9: Add frontend lifecycle forms, upload workflow, and reviewer management

**Files:**
- Create: `src/components/Dialog.tsx`
- Create: `src/components/ConfirmDialog.tsx`
- Create: `src/features/contracts/ContractEditor.tsx`
- Create: `src/features/contracts/ContractLifecycleActions.tsx`
- Create: `src/features/contracts/VersionEditor.tsx`
- Create: `src/features/contracts/VersionUpload.tsx`
- Create: `src/features/clauses/ClauseEditor.tsx`
- Create: `src/features/obligations/ObligationManager.tsx`
- Create: `src/features/reviewers/ReviewerEditor.tsx`
- Create: corresponding `*.test.tsx` files
- Modify: `src/pages/ContractsPage.tsx`
- Modify: `src/pages/ContractDetailPage.tsx`
- Modify: `src/pages/ComplianceCoveragePage.tsx`
- Modify: `src/pages/ReviewerAssignmentPage.tsx`
- Modify: `src/index.css`
- Modify: `src/workspace.css`

**Interfaces:**
- Consumes: mutation endpoints from Tasks 3, 6, and 7.
- Produces: accessible create/edit/archive/restore/upload controls integrated into existing pages.

- [ ] **Step 1: Write failing contract editor tests**

```tsx
it('keeps entered values when the API rejects a duplicate contract', async () => {
  server.enqueueError(409, 'duplicate_contract', 'Contract ID already exists')
  render(<ContractEditor open onClose={vi.fn()} onSaved={vi.fn()} />)
  await userEvent.type(screen.getByLabelText('Contract name'), 'Duplicate Agreement')
  await userEvent.click(screen.getByRole('button', { name: 'Create contract' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('already exists')
  expect(screen.getByLabelText('Contract name')).toHaveValue('Duplicate Agreement')
})
```

- [ ] **Step 2: Verify RED, implement accessible dialog and editor, verify GREEN**

Dialog requirements: labelled title, `aria-modal`, Escape close when not saving, initial focus, focus return, and no close on failed mutation. Archive confirmation must state that restoration is available.

- [ ] **Step 3: Write failing upload feedback tests**

```tsx
it('explains scanned PDF rejection without clearing the selected metadata', async () => {
  server.enqueueError(422, 'document_text_unavailable', 'No extractable text; OCR is not configured')
  render(<VersionUpload contractId="CTR-001" onCreated={vi.fn()} />)
  await selectFile(screen.getByLabelText('Contract document'), scannedPdf)
  await userEvent.type(screen.getByLabelText('Version label'), 'v4.0')
  await userEvent.click(screen.getByRole('button', { name: 'Upload version' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('OCR is not configured')
  expect(screen.getByLabelText('Version label')).toHaveValue('v4.0')
})
```

- [ ] **Step 4: Verify RED, implement upload and clause/reviewer editors, verify GREEN**

Show allowed types and 10 MiB limit before selection. `VersionEditor` creates a version from manually entered clauses without a file. Clause editor supports archive/restore and obligation checkbox replacement. `ObligationManager` on Compliance Coverage creates, edits, and archives obligation records, then reloads coverage. Reviewer editor reports capacity conflicts next to capacity and preserves expertise selection.

Add this obligation persistence test before implementing the manager:

```tsx
it('creates an obligation and refreshes coverage', async () => {
  server.enqueueJson(201, { id: 'OBL-011', name: 'Incident escalation', category: 'Security' })
  server.enqueueJson(200, coverageWith('Incident escalation'))
  renderApp('/compliance-coverage')
  await userEvent.click(await screen.findByRole('button', { name: 'Manage obligations' }))
  await userEvent.click(screen.getByRole('button', { name: 'Add obligation' }))
  await userEvent.type(screen.getByLabelText('Obligation name'), 'Incident escalation')
  await userEvent.type(screen.getByLabelText('Category'), 'Security')
  await userEvent.click(screen.getByRole('button', { name: 'Save obligation' }))
  expect(await screen.findByText('Incident escalation')).toBeVisible()
})
```

- [ ] **Step 5: Add bulk selection tests and implementation**

Test that select-all applies only to the visible page, the bulk bar reports the exact selected count, and a failed atomic action keeps selection for retry.

- [ ] **Step 6: Run frontend tests, lint, and typecheck; commit**

```powershell
npm test -- --run
npm run lint
npm run typecheck
git add src
git commit -m "feat: add contract content and reviewer workflows"
```

### Task 10: Add critical Playwright workflows and finish documentation

**Files:**
- Create: `playwright.config.ts`
- Create: `e2e/contract-lifecycle.spec.ts`
- Create: `e2e/reviewer-lifecycle.spec.ts`
- Modify: `README.md`
- Modify: `backend/README.md`
- Modify: `.github/workflows/verify.yml`

**Interfaces:**
- Consumes: completed API and UI.
- Produces: reproducible full-stack verification and CI gates.

- [ ] **Step 1: Write failing browser workflow**

```ts
test('creates, versions, edits, archives, and restores a contract', async ({ page }) => {
  await page.goto('/contracts')
  await page.getByRole('button', { name: 'Add contract' }).click()
  await page.getByLabel('Contract name').fill('Playwright Services Agreement')
  await page.getByLabel('Contract type').selectOption('Services')
  await page.getByLabel('Owner').fill('Legal Operations')
  await page.getByLabel('Department').fill('Legal')
  await page.getByLabel('Effective date').fill('2026-10-01')
  await page.getByLabel('Expiry date').fill('2027-10-01')
  await page.getByLabel('Compliance').selectOption('Needs Review')
  await page.getByRole('button', { name: 'Create contract' }).click()
  await expect(page.getByRole('heading', { name: 'Playwright Services Agreement' })).toBeVisible()
  await page.getByRole('button', { name: 'Add version' }).click()
  await page.getByLabel('Version label').fill('v1.0')
  await page.getByLabel('Effective date').fill('2026-10-01')
  await page.getByLabel('Author').fill('Legal Operations')
  await page.getByLabel('Contract document').setInputFiles('e2e/fixtures/agreement.txt')
  await page.getByRole('button', { name: 'Upload version' }).click()
  await expect(page.getByText('2 clauses imported')).toBeVisible()
  await page.getByRole('button', { name: 'Edit Scope clause' }).click()
  await page.getByLabel('Clause title').fill('Service Scope')
  await page.getByRole('button', { name: 'Save clause' }).click()
  await expect(page.getByText('Service Scope')).toBeVisible()
  await page.getByRole('button', { name: 'Archive contract' }).click()
  await page.getByRole('button', { name: 'Confirm archive' }).click()
  await page.reload()
  await expect(page.getByText('Archived')).toBeVisible()
  await page.getByRole('button', { name: 'Restore contract' }).click()
  await page.reload()
  await expect(page.getByRole('button', { name: 'Archive contract' })).toBeVisible()
})
```

- [ ] **Step 2: Verify RED, complete exact selectors and fixture setup, verify GREEN**

Use the deterministic reset command in Playwright `webServer` setup. Store browser fixtures under `e2e/fixtures`; do not use external downloads or services.

- [ ] **Step 3: Add CI workflow**

Configure Windows or Ubuntu jobs to use Python 3.14 and the project Node version, install pinned dependencies, run migrations/reset, backend tests, frontend tests, lint, typecheck, and build. Run Playwright Chromium after installing its browser package.

- [ ] **Step 4: Replace the one-line README with exact operating instructions**

Document clone, Python compatibility preflight, install, migration, seed/reset, tests, run commands, upload behavior, algorithm objectives, security warning, and deferred features. Link the academic PDFs instead of moving them.

- [ ] **Step 5: Run the complete verification matrix**

```powershell
cd backend
..\.venv\Scripts\python.exe -m pytest -q
cd ..
npm test -- --run
npm run lint
npm run typecheck
npm run build
npm run test:e2e
git diff --check
git status --short
```

Expected: every command exits 0; no untracked generated files appear.

- [ ] **Step 6: Commit**

```powershell
git add .github README.md backend/README.md playwright.config.ts e2e
git commit -m "test: verify complete contract lifecycle workflows"
```

### Task 11: Final clean-seed and live verification

**Files:**
- Modify only if verification exposes a failing behavior, with a failing regression test first.

**Interfaces:**
- Produces: clean deterministic local state and evidence for handoff.

- [ ] **Step 1: Reset and seed through migrations**

Run: `cd backend; ..\.venv\Scripts\python.exe -m app.seed reset`

Expected counts: 12 contracts, 36 versions, 276 clauses, 10 obligations, 6 reviewers.

- [ ] **Step 2: Start both applications and smoke-test live routes**

Verify health, contract CRUD, upload, pagination, search, comparison, similarity, coverage, reviewer proposal, reviewer lifecycle, review decisions, settings, audit events, and browser JSON download.

- [ ] **Step 3: Inspect desktop and 390px layouts**

Confirm no page-level horizontal overflow, dialogs remain operable, tables scroll within their containers, focus returns after dialogs, and error messages are visible to assistive technology.

- [ ] **Step 4: Reset the database again and stop both servers**

Leave the repository with deterministic seed data excluded from Git and no development ports listening.

- [ ] **Step 5: Review commit history and repository diff**

Run:

```powershell
git log --oneline --decorate main..HEAD
git diff --stat main...HEAD
git status --short
```

Expected: clean status and focused commits covering baseline, migrations, lifecycle, ingestion, frontend, tests, and documentation.
