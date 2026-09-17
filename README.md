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
- Persistent review decisions, assignments, settings, and append-only audit events
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

The database stores normalized contracts, versions, clauses, tags, obligations, reviewers, expertise, assignments, reviews, decisions, settings, and audit events.

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

Detailed inputs, outputs, tie-breaking, limitations, and complexity derivations are in [backend/docs/algorithms.md](backend/docs/algorithms.md).

## Deterministic demonstration dataset

Resetting the database always recreates:

- 12 synthetic contracts across privacy, technology, procurement, commercial, research, and financial domains
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
..\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

In a second terminal:

```powershell
Set-Location <repository-root>
$env:VITE_API_BASE_URL = "http://127.0.0.1:8000"
npm run dev -- --host 127.0.0.1 --port 5181
```

Open `http://127.0.0.1:5181`. API documentation is at `http://127.0.0.1:8000/docs`.

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

## API overview

Resources include `/contracts`, `/contracts/{id}`, `/clauses`, `/reviews`, `/reviewers`, `/audit-events`, and `/settings`. Algorithm operations are exposed through:

- `POST /clause-search`
- `POST /version-comparisons`
- `POST /similarity/graph`
- `POST /compliance/coverage`
- `POST /reviewer-assignments/propose`
- `POST /reviewer-assignments/confirm`

List responses use `{ items, page, pageSize, total, totalPages }`. Errors use `{ error: { code, message, details? } }`.

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
- Authentication, OCR/scanned-document extraction, external regulatory feeds, and AI/LLM features are not implemented.
- Document ingestion accepts text-bearing PDF, DOCX, and TXT files up to 10 MiB and rejects empty or scanned-only inputs.
- A later production phase could add authenticated roles, OCR, object storage, and larger benchmark corpora without replacing the classical algorithms.

## Team

Team VAS, Team 05, Section 13.
