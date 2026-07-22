from __future__ import annotations

import argparse
from collections import Counter
from pathlib import Path

import yaml


class TraceabilityError(ValueError):
    pass


def validate_bundle(bundle: dict, contract: dict, root: Path) -> None:
    errors: list[str] = []
    nodes = bundle.get("nodes", [])
    links = bundle.get("links", [])
    ids = [item.get("id") for item in nodes]
    duplicates = sorted(item for item, count in Counter(ids).items() if count > 1)
    if duplicates:
        errors.append(f"duplicate node IDs: {duplicates}")
    by_id = {item.get("id"): item for item in nodes}
    allowed_types = set(contract["node_types"])
    active_statuses = set(contract["active_statuses"])
    inactive_statuses = set(contract["inactive_statuses"])
    for node in nodes:
        if node.get("type") not in allowed_types:
            errors.append(f"unknown node type for {node.get('id')}: {node.get('type')}")
        if node.get("status") not in active_statuses | inactive_statuses:
            errors.append(f"unknown node status for {node.get('id')}: {node.get('status')}")
        if node.get("id") == "GATE_PASS":
            errors.append("GATE_PASS is a result code, not a gate ID")
        if node.get("path") and not (root / node["path"]).exists():
            errors.append(f"missing referenced path for {node.get('id')}: {node['path']}")
        if node.get("status") in inactive_statuses and not node.get("reason") and node.get("status") != "retired":
            errors.append(f"inactive node {node.get('id')} requires a reason")

    link_keys = [(item.get("type"), item.get("from"), item.get("to")) for item in links]
    if len(link_keys) != len(set(link_keys)):
        errors.append("duplicate typed links")
    outgoing: dict[str, set[str]] = {item: set() for item in by_id}
    incoming: dict[str, set[str]] = {item: set() for item in by_id}
    typed = contract["typed_links"]
    for link in links:
        rule = typed.get(link.get("type"))
        source = by_id.get(link.get("from"))
        target = by_id.get(link.get("to"))
        if rule is None:
            errors.append(f"unknown link type: {link.get('type')}")
            continue
        if source is None or target is None:
            errors.append(f"unknown link endpoint: {link.get('from')} -> {link.get('to')}")
            continue
        if source.get("type") != rule["from"] or target.get("type") != rule["to"]:
            errors.append(f"wrong namespaces for link {link.get('type')}: {link.get('from')} -> {link.get('to')}")
            continue
        outgoing[source["id"]].add(link["type"])
        incoming[target["id"]].add(link["type"])

    required = {
        "evidence": (set(), {"claim_evidence"}),
        "claim": ({"claim_evidence"}, {"metric_claim"}),
        "metric": ({"metric_claim"}, {"gate_metric"}),
        "gate": ({"gate_metric"}, {"protocol_gate"}),
        "protocol": ({"protocol_gate"}, set()),
    }
    for node in nodes:
        if node.get("status") not in active_statuses:
            continue
        required_out, required_in = required[node["type"]]
        if not required_out <= outgoing[node["id"]] or not required_in <= incoming[node["id"]]:
            errors.append(f"active orphan node: {node['id']}")
    if errors:
        raise TraceabilityError("; ".join(errors))


def validate_contract(contract: dict, root: Path) -> None:
    if contract.get("coverage") != "bootstrap_partial":
        raise TraceabilityError("coverage cannot advance before canonical migration")
    for source in contract.get("canonical_sources", []):
        path = root / source["path"]
        if source.get("status") == "planned" and not path.exists():
            continue
        if not path.exists():
            raise TraceabilityError(f"canonical source missing without planned status: {source['path']}")
    bundle = yaml.safe_load((root / contract["bootstrap_bundle"]).read_text(encoding="utf-8"))
    validate_bundle(bundle, contract, root)


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate typed Expanded-10 traceability links.")
    parser.add_argument("--contract", required=True)
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[2]
    contract = yaml.safe_load((root / args.contract).read_text(encoding="utf-8"))
    try:
        validate_contract(contract, root)
    except TraceabilityError as error:
        print(f"FAIL: {error}")
        return 1
    print("PASS: traceability bootstrap and typed orphan checks passed; canonical coverage remains partial")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
