"""Dynamic-programming clause alignment and word-level LCS."""

from .search import tokenize


def word_lcs(before: str, after: str) -> list[str]:
    left, right = tokenize(before), tokenize(after)
    table = [[0] * (len(right) + 1) for _ in range(len(left) + 1)]
    for i in range(1, len(left) + 1):
        for j in range(1, len(right) + 1):
            if left[i - 1] == right[j - 1]:
                table[i][j] = table[i - 1][j - 1] + 1
            else:
                table[i][j] = max(table[i - 1][j], table[i][j - 1])
    result: list[str] = []
    i, j = len(left), len(right)
    while i and j:
        if left[i - 1] == right[j - 1]:
            result.append(left[i - 1])
            i -= 1
            j -= 1
        elif table[i - 1][j] >= table[i][j - 1]:
            i -= 1
        else:
            j -= 1
    return list(reversed(result))


def align_clause_sequences(before: list[dict], after: list[dict]) -> list[dict]:
    """Align stable clause keys using an LCS dynamic-programming table."""
    n, m = len(before), len(after)
    table = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(n - 1, -1, -1):
        for j in range(m - 1, -1, -1):
            if before[i]["key"] == after[j]["key"]:
                table[i][j] = 1 + table[i + 1][j + 1]
            else:
                table[i][j] = max(table[i + 1][j], table[i][j + 1])

    changes: list[dict] = []
    i = j = 0
    while i < n or j < m:
        if i < n and j < m and before[i]["key"] == after[j]["key"]:
            if before[i]["text"] != after[j]["text"]:
                changes.append({
                    "clauseKey": before[i]["key"],
                    "kind": "Modified",
                    "before": before[i]["text"],
                    "after": after[j]["text"],
                    "commonWords": word_lcs(before[i]["text"], after[j]["text"]),
                })
            i += 1
            j += 1
        elif i < n and (j == m or table[i + 1][j] >= table[i][j + 1]):
            changes.append({"clauseKey": before[i]["key"], "kind": "Removed", "before": before[i]["text"]})
            i += 1
        else:
            changes.append({"clauseKey": after[j]["key"], "kind": "Added", "after": after[j]["text"]})
            j += 1
    return changes
