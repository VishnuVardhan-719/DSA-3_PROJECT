# Optional contract import samples

These files are separate from the synthetic demonstration seed. Import them explicitly from **Contracts > Import dataset**. Each file contains 200 records; importing both adds 400 contracts. Reimporting creates more records rather than deduplicating the source corpus.

## CUAD clause annotations

`cuad_contract_clauses.json` contains 200 contracts and 5,251 annotated clause spans from CUAD v1. The converter sorts contract titles, samples evenly, includes answers from every paragraph, collapses whitespace, and clips titles/text to the API field limits. The result contains labelled excerpts, not complete contract documents.

- Creator: The Atticus Project, Contract Understanding Atticus Dataset (CUAD).
- Original source: https://www.atticusprojectai.org/cuad
- Source archive used here: https://www.kaggle.com/datasets/konradb/atticus-open-contract-dataset-aok-beta
- Dataset license: Creative Commons Attribution 4.0 International (CC BY 4.0).
- License and attribution terms: https://creativecommons.org/licenses/by/4.0/
- Original license listing: https://www.atticusprojectai.org/legal/

The Atticus Project provides CUAD without warranty and states that it is not legal advice (https://www.atticusprojectai.org/disclaimer/). Including this dataset is not a claim that all underlying source-document rights are cleared.

Contract type, owner, department, compliance state, and version label are normalization defaults, not findings from a legal review. Counterparty is a filename-derived label, not a verified party. When a title contains a recognizable date, it becomes the effective-date placeholder; expiry is set 1,095 days later for demonstration. When there is no recognizable date, the importer supplies its documented current-date defaults. None of these dates establishes actual contract terms.

## SEC EDGAR filing metadata

`sec_edgar_exhibit_filings.csv` contains 200 filing-index records. The converter drops generic exhibit titles, sorts by filing date/accession, samples evenly, and maps the filing metadata to the import schema. It does not download or include the exhibit bodies and therefore creates no clauses.

- Source publisher: Kharanshu Valangar, `kharanshuvalangar/sec-filings` on Kaggle.
- Source: https://www.kaggle.com/datasets/kharanshuvalangar/sec-filings
- Publisher-declared dataset license: Open Data Commons Attribution License (ODC-By), checked through Kaggle metadata on 2026-09-30.
- License and attribution terms: https://opendatacommons.org/licenses/by/1-0/

This sample is adapted from that database; its publisher's license declaration does not replace any rights attached to individual source documents. Company, accession number, and filing URL remain in each record's description. The SEC filing date is used as an effective-date placeholder, and expiry is set 1,095 days later. Neither is a verified contract date. Owner, department, and compliance state are demonstration defaults. This is a historical snapshot, not a live regulatory feed.

The adapted SEC sample is made available under ODC-By 1.0. Contains information from `Sec_Filing` by Kharanshu Valangar, made available under the ODC Attribution License at the source and license addresses above. Retain this notice when redistributing the sample.

## Rebuild and verify

Extract the source archives into the directories named by `CUAD_SOURCE` and `SEC_SOURCE` in `tools/build_kaggle_datasets.py`. From the repository root:

```powershell
.\.venv\Scripts\python.exe tools\build_kaggle_datasets.py --source .scratch\kaggle --out datasets --limit 200
Set-Location backend
..\.venv\Scripts\python.exe -m pytest tests/test_dataset_builder.py tests/test_dataset_import.py -q
```

No source downloads occur during conversion. Limits must be between 1 and 200. Both output payloads are checked against the importer's 5 MiB file cap and non-empty record limit before either output is written. Raw archives stay outside version control. Tests import both bundled files into temporary databases; they do not modify the developer database.

These samples support an academic demonstration. They are not legal advice, compliance certification, or a verified account of any company's agreements.