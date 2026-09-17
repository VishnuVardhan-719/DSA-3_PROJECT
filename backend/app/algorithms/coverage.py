"""Deterministic greedy set cover."""


def greedy_set_cover(universe: set[str], candidates: dict[str, set[str]]) -> dict[str, list[str]]:
    uncovered = set(universe)
    selected: list[str] = []
    while uncovered:
        ranked = sorted(
            ((-len(values & uncovered), clause_id) for clause_id, values in candidates.items()),
        )
        if not ranked or -ranked[0][0] == 0:
            break
        clause_id = ranked[0][1]
        selected.append(clause_id)
        uncovered -= candidates[clause_id]
    return {
        "selected": selected,
        "covered": sorted(universe - uncovered),
        "uncovered": sorted(uncovered),
    }
