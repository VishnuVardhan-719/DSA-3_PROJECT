import importlib.util
import json
from pathlib import Path

import pytest


spec = importlib.util.spec_from_file_location(
    "dataset_builder", Path(__file__).resolve().parents[2] / "tools" / "build_kaggle_datasets.py"
)
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)


def test_single_record_sample_is_supported():
    assert builder.even_spread(["first", "second", "third"], 1) == ["first"]


@pytest.mark.parametrize("limit", ["0", "201"])
def test_invalid_limit_is_rejected_before_reading_sources(tmp_path, monkeypatch, limit):
    monkeypatch.setattr("sys.argv", ["build", "--source", str(tmp_path), "--limit", limit])
    with pytest.raises(SystemExit) as error:
        builder.main()
    assert error.value.code == 2


def test_cuad_preserves_answers_from_all_paragraphs(tmp_path):
    source = tmp_path / "cuad.json"
    source.write_text(json.dumps({"data": [{
        "title": "Example Agreement",
        "paragraphs": [
            {"qas": [{"question": 'Find "Confidentiality"', "answers": [
                {"text": "Keep records confidential."}, {"text": "Do not disclose secrets."}
            ]}]},
            {"qas": [{"question": 'Find "Termination"', "answers": [
                {"text": "Give thirty days notice."}
            ]}]},
        ],
    }]}), encoding="utf-8")
    records = builder.build_cuad(source, 1)
    assert [clause["text"] for clause in records[0]["clauses"]] == [
        "Keep records confidential.", "Do not disclose secrets.", "Give thirty days notice."
    ]


def test_guard_checks_csv_record_count():
    json_payload = json.dumps({"contracts": [{"name": "Valid"}]}).encode("utf-8")
    csv_payload = ("name\n" + "Valid\n" * (builder.MAX_RECORDS + 1)).encode("utf-8")
    with pytest.raises(SystemExit, match="records"):
        builder.guard({Path("cuad.json"): json_payload, Path("sec.csv"): csv_payload})


def test_oversized_csv_does_not_overwrite_existing_outputs(tmp_path, monkeypatch):
    json_path = tmp_path / "cuad_contract_clauses.json"
    csv_path = tmp_path / "sec_edgar_exhibit_filings.csv"
    json_path.write_bytes(b"original JSON")
    csv_path.write_bytes(b"original CSV")
    monkeypatch.setattr(builder, "MAX_BYTES", 500)
    monkeypatch.setattr(builder, "build_cuad", lambda *args: [{"name": "Valid", "clauses": []}])
    monkeypatch.setattr(builder, "build_sec_filings", lambda *args: [
        {"name": "Valid", "description": "x" * 501}
    ])
    monkeypatch.setattr("sys.argv", ["build", "--out", str(tmp_path)])
    with pytest.raises(SystemExit, match="bytes"):
        builder.main()
    assert json_path.read_bytes() == b"original JSON"
    assert csv_path.read_bytes() == b"original CSV"