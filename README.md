# Contract & Compliance Version-Intelligence Platform

A local, explainable contract-review system built for Data Structures and Algorithms-3 (`25CS2103E`, academic year 2026–2027). It connects the React workbench to a FastAPI and SQLite backend whose results come from handwritten deterministic algorithms rather than AI or fabricated scores.

The demonstration dataset is synthetic and must not be treated as legal advice, compliance certification, or real company data.

## Features

- Portfolio dashboard, server-paginated contract register, contract creation/edit/archive, contract detail, versions, clauses, compliance, and review history
- Validated local PDF, DOCX, and TXT version ingestion with deterministic clause segmentation
- Reviewer profiles, expertise/capacity lifecycle, and obligation catalogue management
- Inverted-index clause search with Boolean retrieval and matched-term evidence
- Dynamic-programming version alignment with word-level longest common subsequence evidence
- TF-IDF cosine similarity, threshold graphs, and DFS connected components
- Greedy Set Cover with a coverage matrix, uncovered obligations, and deterministic tie-breaking
- Capacity-aware reviewer allocation through handwritten min-cost max-flow
- Versioned compliance playbooks with deterministic phrase-based clause checks, actionable deviation evidence, high-risk review tasks, legal exception overrides, and approval gates
- Persistent review decisions, assignments, settings, and append-only audit events with local actor attribution
- Browser-generated JSON contract summaries from already-fetched data; no export backend exists

## Architecture

```text
React + TypeScript UI
        |
        v
Typed REST requests
        |
        v
FastAPI routes -> domain orchestration -> handwritten algorithms
        |                                  |
        +-------------- SQLAlchemy --------+
                           |
                         SQLite
```

The database stores normalized contracts, versions, clauses, tags, obligations, versioned playbooks/rules/findings, reviewers, expertise, assignments, reviews, decisions, settings, and audit events.

## Algorithms and data structures

| Capability | Data structure / algorithm | Key complexity |
| --- | --- | --- |
| Clause search | `term -> sorted clause IDs` inverted index | Build `O(T)`; lookup proportional to query postings |
| Version analysis | Dynamic-programming sequence alignment and word LCS | `O(nm)` time and space |
| Similarity | Sparse dictionaries, TF-IDF, cosine similarity | Pairwise cosine over shared vocabulary |
| Clustering | Adjacency sets and iterative DFS | `O(V + E)` |
| Coverage | Greedy Set Cover | Direct repeated maximum-gain selection |
| Assignment | Residual graph and min-cost max-flow | Successive shortest augmenting paths |

The reviewer proposal objective is exactly: **maximize valid assignments first, then minimize workload/expertise cost**.

Every algorithm endpoint returns evidence intended for inspection rather than a bare score:

- Search returns matched normalized terms, per-clause term frequencies, deterministic Boolean retrieval order, and source metadata.
- Version comparison returns added, removed, modified, and unchanged counts plus word-level `equal`, `insert`, and `delete` spans.
- Similarity returns the applied threshold, every retained edge score, compared-pair count, connected components, and isolated contract IDs.
- Coverage returns selected clauses, clause-to-obligation mappings, uncovered obligations, and the gain recorded at every greedy step. Greedy Set Cover is an approximation and is not guaranteed optimal.
- Assignment returns per-contract explanations, total cost, eligible-pair count, projected reviewer loads, remaining capacity, and a reason for every unassigned contract.
- Playbooks use explainable case-insensitive clause-category and phrase checks. A high-risk `Needs Review` finding creates one open review task and blocks contract approval until a Legal Reviewer or Administrator records an auditable `Exception` override.

Detailed inputs, outputs, tie-breaking, limitations, and complexity derivations are in [backend/docs/algorithms.md](backend/docs/algorithms.md).

Submission material is available in the editable [final project report](docs/Contract_Compliance_Final_Project_Report.docx) and the concise [demo and viva guide](docs/DEMO_VIVA_GUIDE.md). The report can be regenerated with `tools/build_project_report.py` using the bundled document runtime or any Python environment with `python-docx` installed.

## Deterministic demonstration dataset

Resetting the database always recreates:

- 12 synthetic contracts across privacy, technology, procurement, commercial, research, and financial domains

## Importing external contract datasets

The **Contracts** page supports two entry paths: **Import dataset** for an initial corpus and **Add contract manually** for individual records. Dataset imports accept UTF-8 `.json` or `.csv` files up to 5 MB and 200 records, are validated before they are committed, and are atomic: an invalid row prevents all rows in that file from being imported.

- **JSON:** upload either an array of contract records or `{ "contracts": [...] }`. Use `name` (or `title`), optional `type`, `effectiveDate`, `expiryDate`, and optional `clauses: [{ "title", "text" }]` for a first contract version.
- **CSV:** include a `name` or `title` column. Optional columns include `type`, `effectiveDate`, `expiryDate`, `counterparty`, `jurisdiction`, and `description`.
- CUAD-style clause exports must be normalized to JSON so source clause wording can be included. SEC/EDGAR-style filing metadata must be normalized to CSV or JSON. Raw upstream CUAD releases and raw SEC API responses are not directly accepted.

Missing owner, department, compliance status, and date values receive explicit dataset-import defaults and must be reviewed before a contract is approved. The importer is a structured metadata loader; it does not infer legal terms from raw PDFs or research labels.
- 36 versions and 276 clause-version rows, with 7–8 clauses per version
- Added, removed, unchanged, and modified clause cases
- 10 obligations with deterministic clause mappings
- 6 reviewers with expertise, workload, and capacity
- Persistent review items, settings, and audit events

## Requirements and Python 3.14 safety

- Node.js and npm
- The existing `C:\Python314\python.exe`, version 3.14.4

Do not replace or downgrade Python. Verify binary compatibility before installation:

```powershell
C:\Python314\python.exe --version
C:\Python314\python.exe -m pip install --dry-run --ignore-installed --only-binary=:all: fastapi==0.141.1 sqlalchemy==2.0.54 pydantic==2.13.5 uvicorn==0.53.0 pytest==9.1.1 httpx==0.28.1
C:\Python314\python.exe -m venv .venv
.\.venv\Scripts\python.exe --version
.\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
```

If the dry run fails, stop instead of changing Python.

## Initialize and run

```powershell
npm install
.\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt

Set-Location backend
..\.venv\Scripts\python.exe -m app.seed reset
..\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8100
```

In a second terminal:

```powershell
Set-Location <repository-root>
npm run dev -- --host 127.0.0.1 --port 5181
```

Open `http://127.0.0.1:5181`. API documentation is at `http://127.0.0.1:8100/docs`.

The frontend defaults to `http://127.0.0.1:8100`. Port `8000` is deliberately avoided because unrelated local services commonly occupy it, and any FastAPI service answers `/health`. Set `VITE_API_BASE_URL` to override the target. The top bar reports **Wrong API** when the configured address is answered by a different service instead of this one.

## Verification

```powershell
Set-Location backend
..\.venv\Scripts\python.exe -m pytest -q
..\.venv\Scripts\python.exe -c "from app.main import app; print(app.title)"

Set-Location ..
npm run lint
npm run typecheck
npm test -- --run
npm run build
npx playwright install chromium
npm run test:e2e
```

Expected checks are the full backend Pytest suite, Oxlint, TypeScript project compilation, Vitest, the production Vite build, and Chromium Playwright tests. Run them from a clean deterministic seed when comparing exact record counts or screenshots.

## API overview

Resources include `/contracts`, `/contracts/{id}`, `/clauses`, `/reviews`, `/reviewers`, `/audit-events`, and `/settings`. Algorithm operations are exposed through:

- `POST /clause-search`
- `POST /version-comparisons`
- `POST /similarity/graph`
- `POST /compliance/coverage`
- `POST /reviewer-assignments/propose`
- `POST /reviewer-assignments/confirm`

List responses use `{ items, page, pageSize, total, totalPages }`. Errors use `{ error: { code, message, details? } }`.

Pydantic models use snake_case internally and emit camelCase aliases at the API boundary. The TypeScript domain interfaces mirror those external camelCase payloads.

## Project structure

```text
src/                    React routes, UI components, typed API client
backend/app/algorithms/ Independent handwritten DSA modules
backend/app/            API, schemas, models, database, deterministic seed
backend/tests/          Algorithm and persistence/API tests
backend/docs/           Viva-oriented algorithm documentation
```

## Limitations and future scope

- The corpus is intentionally compact and synthetic.
- SQLite and `create_all` suit this local academic project; production migrations and concurrent deployment are outside scope.
- Local mutations require the seeded `X-Actor-Id` identity header: `USR-001` (Administrator), `USR-002` (Legal Reviewer), or `USR-003` (Read Only). The React client uses `USR-001` by default and can be switched through `localStorage.contractWorkspaceActorId`.
- This local identity header provides role enforcement and audit attribution, **not production authentication**: there are no passwords, sessions, encrypted credentials, tenants, or SSO yet.
- OCR/scanned-document extraction, external regulatory feeds, and AI/LLM features are not implemented.
- Document ingestion accepts text-bearing PDF, DOCX, and TXT files up to 10 MiB and rejects empty or scanned-only inputs.
- A later production phase could add authenticated roles, OCR, object storage, and larger benchmark corpora without replacing the classical algorithms.

## Team

Team VAS, Team 05, Section 13.
