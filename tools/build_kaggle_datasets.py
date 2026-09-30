"""Normalize public Kaggle contract datasets into the workspace import format.

The dataset importer in `backend/app/api/contracts.py` accepts a UTF-8 `.json` file
holding `{"contracts": [...]}` (or a bare array) or a UTF-8 `.csv` file, capped at
200 records and 5 MB. Upstream Kaggle releases do not follow that shape, so this tool
maps them and refuses to emit a file the importer would reject.

Raw archives are downloaded separately (they are third-party data and are not
committed):

    curl -L -o cuad.zip "https://www.kaggle.com/api/v1/datasets/download/konradb/atticus-open-contract-dataset-aok-beta"
    curl -L -o sec.zip  "https://www.kaggle.com/api/v1/datasets/download/kharanshuvalangar/sec-filings"

Usage:
    python tools/build_kaggle_datasets.py --source .scratch/kaggle --out datasets
"""

from __future__ import annotations

import argparse
import csv
import io
import json
import re
from datetime import date, timedelta
from pathlib import Path

MAX_RECORDS = 200
MAX_BYTES = 5 * 1024 * 1024

CUAD_SOURCE = "konradb_atticus-open-contract-dataset-aok-beta/CUAD_v1/CUAD_v1.json"
SEC_SOURCE = "kharanshuvalangar_sec-filings/sec_filings.csv"

DATE_PATTERNS = (
    re.compile(r"(?<!\d)(\d{4})(\d{2})(\d{2})(?!\d)"),  # 20140520
    re.compile(r"(?<!\d)(\d{2})[_-](\d{2})[_-](\d{4})(?!\d)"),  # 09_09_1999
)


def clean(value: object, limit: int = 200) -> str:
    """Collapse whitespace and guarantee the value survives a UTF-8 round trip."""
    text = re.sub(r"\s+", " ", str(value or "")).strip()
    text = text.encode("utf-8", "replace").decode("utf-8")
    return text[:limit]


def even_spread(items: list, limit: int) -> list:
    """Deterministically sample `limit` items spaced across the whole corpus."""
    if len(items) <= limit:
        return list(items)
    if limit == 1:
        return items[:1]
    step = (len(items) - 1) / (limit - 1)
    return [items[round(index * step)] for index in range(limit)]


def term_dates(effective: date) -> tuple[str, str]:
    return effective.isoformat(), (effective + timedelta(days=1095)).isoformat()


def date_from_title(title: str) -> date | None:
    for pattern in DATE_PATTERNS:
        match = pattern.search(title)
        if not match:
            continue
        parts = [int(part) for part in match.groups()]
        year, month, day = (parts[0], parts[1], parts[2]) if len(str(parts[0])) == 4 else (parts[2], parts[0], parts[1])
        try:
            return date(year, month, day)
        except ValueError:
            continue
    return None


def clause_category(question: str) -> str:
    quoted = question.split('"')
    return clean(quoted[1] if len(quoted) > 1 else question, 160)


def build_cuad(path: Path, limit: int) -> list[dict]:
    """CUAD: one record per contract, each carrying its labelled clause spans."""
    corpus = json.loads(path.read_text(encoding="utf-8"))
    records = []
    for contract in corpus["data"]:
        clauses = []
        for paragraph in contract["paragraphs"]:
            for qa in paragraph["qas"]:
                if qa.get("is_impossible"):
                    continue
                title = clause_category(qa["question"])
                for answer in qa.get("answers", []):
                    text = clean(answer["text"], 100000)
                    if len(title) >= 2 and text:
                        clauses.append({"title": title, "text": text})
        name = clean(contract["title"], 200)
        if len(name) < 2 or not clauses:
            continue
        record = {"name": name, "type": "SEC Exhibit 10 Agreement", "owner": "CUAD Corpus",
                  "department": "Legal", "compliance": "Needs Review",
                  "counterparty": clean(contract["title"].split("_")[0], 200),
                  "jurisdiction": "",
                  "description": "Contract Understanding Atticus Dataset v1 (CUAD), CC BY 4.0. "
                                 "Clause spans are expert annotations, not a full contract body.",
                  "versionLabel": "v1.0", "clauses": clauses}
        effective = date_from_title(contract["title"])
        if effective:
            record["effectiveDate"], record["expiryDate"] = term_dates(effective)
        records.append(record)
    records.sort(key=lambda item: item["name"])
    return even_spread(records, limit)


def build_sec_filings(path: Path, limit: int) -> list[dict]:
    """SEC EDGAR exhibit index: one record per filed Exhibit 10 material contract."""
    with path.open(encoding="utf-8", errors="replace", newline="") as handle:
        rows = list(csv.DictReader(handle))

    usable = []
    for row in rows:
        exhibit = clean(row.get("Description"), 200)
        # Generic "EXHIBIT 10.1" labels carry no contract title, so prefer real ones.
        if len(exhibit) < 2 or exhibit.upper().startswith("EXHIBIT"):
            continue
        try:
            effective = date.fromisoformat(clean(row.get("Filed At"), 10))
        except ValueError:
            continue
        usable.append((effective, row, exhibit))

    usable.sort(key=lambda item: (item[0], clean(item[1].get("Accession No"), 40)), reverse=True)
    records = []
    for effective, row, exhibit in even_spread(usable, limit):
        company = clean(row.get("Company Name"), 200)
        form = clean(row.get("Form Type"), 20)
        filing = clean(row.get("Filing Type"), 40)
        accession = clean(row.get("Accession No"), 40)
        url = clean(row.get("Filing URL"), 500)
        effective_date, expiry_date = term_dates(effective)
        records.append({
            "name": exhibit,
            "type": clean(f"{form} {filing}".strip() or "SEC Exhibit", 80),
            "owner": "SEC EDGAR",
            "department": "Legal",
            "compliance": "Needs Review",
            "counterparty": company,
            "jurisdiction": "",
            "effectiveDate": effective_date,
            "expiryDate": expiry_date,
            "description": clean(f"SEC EDGAR {form} exhibit {filing}, accession {accession}. "
                                 f"Filed by {company}. Source: {url}", 5000),
        })
    return records


def guard(files: dict[Path, bytes]) -> None:
    for path, payload in files.items():
        if len(payload) > MAX_BYTES:
            raise SystemExit(f"refusing to write {path.name}: {len(payload)} bytes exceeds the {MAX_BYTES} cap")
        text = payload.decode("utf-8")
        records = json.loads(text)["contracts"] if path.suffix == ".json" else list(csv.DictReader(io.StringIO(text)))
        if not 1 <= len(records) <= MAX_RECORDS:
            raise SystemExit(f"refusing to write {path.name}: requires 1 to {MAX_RECORDS} records, got {len(records)}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--source", default=".scratch/kaggle", help="directory holding the extracted Kaggle archives")
    parser.add_argument("--out", default="datasets", help="directory to write importer-ready files into")
    parser.add_argument("--limit", type=int, default=MAX_RECORDS, help=f"records per dataset (max {MAX_RECORDS})")
    args = parser.parse_args()
    if not 1 <= args.limit <= MAX_RECORDS:
        parser.error(f"--limit must be between 1 and {MAX_RECORDS}")

    source = Path(args.source)
    target = Path(args.out)

    cuad = build_cuad(source / CUAD_SOURCE, args.limit)
    sec = build_sec_filings(source / SEC_SOURCE, args.limit)

    cuad_bytes = json.dumps({"contracts": cuad}, ensure_ascii=False, indent=1).encode("utf-8")
    cuad_path = target / "cuad_contract_clauses.json"

    sec_path = target / "sec_edgar_exhibit_filings.csv"
    fields = ["name", "type", "owner", "department", "compliance", "effectiveDate", "expiryDate",
              "counterparty", "jurisdiction", "description"]
    handle = io.StringIO(newline="")
    writer = csv.DictWriter(handle, fieldnames=fields)
    writer.writeheader()
    writer.writerows(sec)
    sec_bytes = handle.getvalue().encode("utf-8")

    files = {cuad_path: cuad_bytes, sec_path: sec_bytes}
    guard(files)
    target.mkdir(parents=True, exist_ok=True)
    for path, payload in files.items():
        path.write_bytes(payload)

    clauses = sum(len(record["clauses"]) for record in cuad)
    print(f"{cuad_path}: {len(cuad)} contracts, {clauses} clauses, {len(cuad_bytes) / 1024:.0f} KB")
    print(f"{sec_path}: {len(sec)} records, {len(sec_bytes) / 1024:.0f} KB")


if __name__ == "__main__":
    main()
