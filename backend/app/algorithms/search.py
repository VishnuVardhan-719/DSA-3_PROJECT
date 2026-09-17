"""Unicode-aware inverted-index search without search libraries."""

from collections import defaultdict
import re
import unicodedata


TOKEN_PATTERN = re.compile(r"[^\W_]+(?:['’][^\W_]+)?", re.UNICODE)


def normalize_text(value: str) -> str:
    return unicodedata.normalize("NFKC", value).casefold()


def tokenize(value: str) -> list[str]:
    return TOKEN_PATTERN.findall(normalize_text(value))


class InvertedIndex:
    def __init__(self, documents: dict[str, str]):
        postings: dict[str, set[str]] = defaultdict(set)
        for document_id in sorted(documents):
            for term in set(tokenize(documents[document_id])):
                postings[term].add(document_id)
        self.postings = dict(postings)

    def search(self, query: str, mode: str = "AND") -> list[str]:
        terms = list(dict.fromkeys(tokenize(query)))
        normalized_mode = mode.upper()
        if normalized_mode not in {"AND", "OR"}:
            raise ValueError("mode must be AND or OR")
        if not terms:
            return []
        sets = [self.postings.get(term, set()) for term in terms]
        matches = set.intersection(*sets) if normalized_mode == "AND" else set.union(*sets)
        return sorted(matches)
