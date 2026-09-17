"""Successive-shortest-path min-cost max-flow reviewer assignment."""

from dataclasses import dataclass
from collections import deque


@dataclass
class Edge:
    to: int
    reverse: int
    capacity: int
    cost: int
    original_capacity: int


def _add_edge(graph: list[list[Edge]], source: int, target: int, capacity: int, cost: int) -> Edge:
    forward = Edge(target, len(graph[target]), capacity, cost, capacity)
    backward = Edge(source, len(graph[source]), 0, -cost, 0)
    graph[source].append(forward)
    graph[target].append(backward)
    return forward


def propose_assignments(tasks: list[dict], reviewers: list[dict]) -> dict:
    ordered_tasks = sorted(tasks, key=lambda item: item["id"])
    ordered_reviewers = sorted(reviewers, key=lambda item: item["id"])
    source = 0
    task_offset = 1
    reviewer_offset = task_offset + len(ordered_tasks)
    sink = reviewer_offset + len(ordered_reviewers)
    graph: list[list[Edge]] = [[] for _ in range(sink + 1)]
    tracked: dict[tuple[str, str], Edge] = {}

    for task_index, task in enumerate(ordered_tasks):
        task_node = task_offset + task_index
        _add_edge(graph, source, task_node, 1, 0)
        required = set(task.get("requiredExpertise", []))
        for reviewer_index, reviewer in enumerate(ordered_reviewers):
            expertise = set(reviewer.get("expertise", []))
            if required and not (required & expertise):
                continue
            expertise_gap = len(required - expertise)
            cost = int(reviewer.get("workload", 0)) * 10 + expertise_gap * 100
            edge = _add_edge(graph, task_node, reviewer_offset + reviewer_index, 1, cost)
            tracked[(task["id"], reviewer["id"])] = edge
    for reviewer_index, reviewer in enumerate(ordered_reviewers):
        available = max(0, int(reviewer.get("capacity", 0)) - int(reviewer.get("workload", 0)))
        _add_edge(graph, reviewer_offset + reviewer_index, sink, available, 0)

    flow = 0
    total_cost = 0
    node_count = len(graph)
    while True:
        distance = [10**18] * node_count
        previous: list[tuple[int, int] | None] = [None] * node_count
        in_queue = [False] * node_count
        distance[source] = 0
        queue = deque([source])
        in_queue[source] = True
        while queue:
            node = queue.popleft()
            in_queue[node] = False
            for edge_index, edge in enumerate(graph[node]):
                candidate = distance[node] + edge.cost
                if edge.capacity > 0 and candidate < distance[edge.to]:
                    distance[edge.to] = candidate
                    previous[edge.to] = (node, edge_index)
                    if not in_queue[edge.to]:
                        queue.append(edge.to)
                        in_queue[edge.to] = True
        if previous[sink] is None:
            break
        node = sink
        while node != source:
            prior, edge_index = previous[node]
            edge = graph[prior][edge_index]
            edge.capacity -= 1
            graph[node][edge.reverse].capacity += 1
            node = prior
        flow += 1
        total_cost += distance[sink]

    assignments: list[dict] = []
    assigned_ids: set[str] = set()
    for task in ordered_tasks:
        for reviewer in ordered_reviewers:
            edge = tracked.get((task["id"], reviewer["id"]))
            if edge is not None and edge.original_capacity == 1 and edge.capacity == 0:
                required = set(task.get("requiredExpertise", []))
                expertise = set(reviewer.get("expertise", []))
                assignments.append({
                    "contractId": task["id"],
                    "reviewerId": reviewer["id"],
                    "cost": edge.cost,
                    "confidence": "Strong fit" if required <= expertise else "Good fit",
                })
                assigned_ids.add(task["id"])
    return {
        "assignments": assignments,
        "assignedCount": flow,
        "totalCost": total_cost,
        "unassignedContractIds": [task["id"] for task in ordered_tasks if task["id"] not in assigned_ids],
    }
