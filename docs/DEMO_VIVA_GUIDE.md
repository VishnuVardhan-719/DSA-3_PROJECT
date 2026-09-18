# Demo and Viva Guide

This guide keeps the project demonstration focused on the implemented data structures and algorithms. Reset the database before the session so every result is deterministic.

## Five minute demonstration

1. Open **Overview** and state that the data is synthetic and local.
2. Open **Clause Search**. Run one AND query and one OR query. Explain that normalized tokens map to posting sets and that set intersection or union produces the result.
3. Open **Version Analysis**. Compare two versions and point to an added, removed, and modified clause. Explain that clause-sequence LCS runs before word-level LCS.
4. Open **Similarity and Clustering**. Change the threshold and explain that edges meeting the threshold form an undirected graph whose connected components are found with DFS.
5. Open **Compliance Coverage**. Explain that greedy Set Cover repeatedly chooses the clause with the highest uncovered gain and uses the smaller clause ID to break ties.
6. Open **Reviewer Assignment**. Generate proposals and state the objective exactly: **maximize valid assignments first, then minimize workload/expertise cost**.
7. Open **Review Queue**, record a decision with evidence notes, and show the resulting event in **Audit Trail**.

## Lifecycle demonstration

1. Create a contract.
2. Create a manual version with at least one clause.
3. Import the TXT fixture as another version.
4. Edit, archive, and restore a clause.
5. Archive and restore the contract from the contract register.
6. Download the fetched-data summary and explain that the browser creates the JSON file from data already loaded by the detail page.

## Core viva answers

### Why is the search deterministic

The index applies the same Unicode normalization, case folding, and tokenization every time. Results are sorted by clause identifier.

### Why use dynamic programming

Clause order matters. The LCS table preserves the longest ordered sequence shared by two versions and gives a reproducible basis for labeling additions and removals.

### Is greedy Set Cover optimal

Not always. Greedy Set Cover is an approximation. The implementation favors explainability and deterministic selection over exhaustive search.

### Why min cost max flow

The flow network expresses contract demand, expertise-valid reviewer edges, and reviewer capacity in one structure. Continuing augmentation until no path remains maximizes valid assignments. Path costs then prefer lower workload and expertise cost.

### What happens when no reviewer is valid

The contract remains unassigned and is reported explicitly. The algorithm does not create an invalid edge merely to fill every slot.

### Why use SQLite

SQLite is sufficient for a local academic application and makes reset and demonstration reproducible. A concurrent production deployment would need a server database and a migration and operations strategy.

### What is deliberately excluded

Authentication, OCR, cloud storage, external compliance feeds, and AI or LLM processing are outside scope. The project evaluates handwritten data structures and algorithms.

## Commands before the demonstration

```powershell
Set-Location backend
..\.venv\Scripts\python.exe -m app.seed reset
..\.venv\Scripts\python.exe -m pytest -q

Set-Location ..
npm run lint
npm run typecheck
npm test -- --run
npm run build
```

Start the backend and frontend in separate terminals using the commands in the repository README.
