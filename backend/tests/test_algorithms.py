import math

import pytest

from app.algorithms.alignment import align_clause_sequences, word_lcs
from app.algorithms.assignment import propose_assignments
from app.algorithms.coverage import greedy_set_cover
from app.algorithms.search import InvertedIndex, tokenize
from app.algorithms.similarity import (
    build_threshold_graph,
    connected_components,
    cosine_similarity,
    tfidf_vectors,
)


def test_inverted_index_normalizes_unicode_case_and_supports_boolean_queries():
    index = InvertedIndex({"C2": "Café retention notice", "C1": "CAFÉ breach notice", "C3": "retention only"})
    assert tokenize("  CAFÉ—Notice ") == ["café", "notice"]
    assert index.search("café notice", "AND") == ["C1", "C2"]
    assert index.search("breach retention", "OR") == ["C1", "C2", "C3"]
    assert index.search("", "AND") == []
    with pytest.raises(ValueError, match="mode"):
        index.search("notice", "XOR")


def test_dynamic_programming_alignment_and_word_lcs_are_deterministic():
    before = [
        {"key": "A", "text": "retain records for 180 days"},
        {"key": "B", "text": "notify promptly"},
    ]
    after = [
        {"key": "A", "text": "retain records for 90 days"},
        {"key": "C", "text": "permit annual audits"},
    ]
    assert word_lcs(before[0]["text"], after[0]["text"]) == ["retain", "records", "for", "days"]
    changes = align_clause_sequences(before, after)
    assert [(item["clauseKey"], item["kind"]) for item in changes] == [
        ("A", "Modified"),
        ("B", "Removed"),
        ("C", "Added"),
    ]
    assert align_clause_sequences([], []) == []


def test_tfidf_uses_documented_formula_and_cosine_handles_zero_vectors():
    vectors = tfidf_vectors({"A": "alpha beta", "B": "alpha gamma", "C": ""})
    expected_idf = math.log(4 / 2) + 1
    assert vectors["A"]["beta"] == pytest.approx(0.5 * expected_idf)
    assert cosine_similarity(vectors["A"], vectors["B"]) > 0
    assert cosine_similarity(vectors["A"], vectors["A"]) == pytest.approx(1)
    assert cosine_similarity(vectors["A"], vectors["C"]) == 0
    assert tfidf_vectors({}) == {}


def test_threshold_graph_and_dfs_components_validate_threshold_and_keep_isolates():
    ids = ["C", "A", "B"]
    similarities = [[1, 0.2, 0.8], [0.2, 1, 0.7], [0.8, 0.7, 1]]
    graph, edges = build_threshold_graph(ids, similarities, 0.75)
    assert edges == [{"source": "B", "target": "C", "score": 0.8}]
    assert connected_components(graph) == [["A"], ["B", "C"]]
    with pytest.raises(ValueError, match="threshold"):
        build_threshold_graph(ids, similarities, 1.01)


def test_greedy_set_cover_uses_clause_id_ties_and_reports_uncovered():
    result = greedy_set_cover({"O1", "O2", "O3"}, {"C2": {"O1", "O2"}, "C1": {"O1", "O2"}, "C3": {"O3"}})
    assert result == {"selected": ["C1", "C3"], "covered": ["O1", "O2", "O3"], "uncovered": []}
    assert greedy_set_cover(set(), {"C1": {"O1"}})["selected"] == []
    assert greedy_set_cover({"O1", "O9"}, {"C1": {"O1"}})["uncovered"] == ["O9"]


def test_min_cost_max_flow_maximizes_count_then_cost_and_respects_capacity():
    tasks = [
        {"id": "T2", "requiredExpertise": ["Privacy"]},
        {"id": "T1", "requiredExpertise": ["Privacy"]},
        {"id": "T3", "requiredExpertise": ["Security"]},
        {"id": "T4", "requiredExpertise": ["Tax"]},
    ]
    reviewers = [
        {"id": "R2", "expertise": ["Privacy", "Security"], "capacity": 1, "workload": 0},
        {"id": "R1", "expertise": ["Privacy"], "capacity": 1, "workload": 0},
    ]
    result = propose_assignments(tasks, reviewers)
    assert result["assignedCount"] == 2
    assert result["assignments"] == [
        {"contractId": "T1", "reviewerId": "R1", "cost": 0, "confidence": "Strong fit"},
        {"contractId": "T2", "reviewerId": "R2", "cost": 0, "confidence": "Strong fit"},
    ]
    assert result["unassignedContractIds"] == ["T3", "T4"]
    assert propose_assignments([], reviewers)["assignedCount"] == 0
