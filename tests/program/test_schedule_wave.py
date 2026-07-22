import importlib.util
import tempfile
import unittest
from copy import deepcopy
from pathlib import Path

import yaml


ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "tools" / "program" / "schedule_wave.py"
SPEC = importlib.util.spec_from_file_location("schedule_wave", SCRIPT)
schedule_wave = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(schedule_wave)


class WaveScheduleTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.registry_path = ROOT / "docs" / "program" / "milestone_registry.yaml"
        cls.resource_path = ROOT / "docs" / "program" / "resource_registry.yaml"
        cls.registry = yaml.safe_load(cls.registry_path.read_text(encoding="utf-8"))
        cls.resources = yaml.safe_load(cls.resource_path.read_text(encoding="utf-8"))

    def test_manifest_is_deterministic_and_capacity_feasible(self):
        first = schedule_wave.build_manifest(self.registry_path, self.resource_path)
        second = schedule_wave.build_manifest(self.registry_path, self.resource_path)
        self.assertEqual(first, second)
        self.assertEqual(first["bands"]["committed"]["ids"], list(schedule_wave.COMMITTED_IDS))
        hours_by_id = {item["id"]: item["expected_work_hours"] for item in self.registry["milestones"]}
        imported_hours = sum(hours_by_id[item] for item in first["imported_satisfied"]["ids"])
        self.assertEqual(first["bands"]["committed"]["hours"] + imported_hours, 58)
        self.assertEqual(first["capacity"]["review_synthesis_replan_overhead_hours"], 16)
        self.assertEqual(
            first["capacity"]["committed_scheduled_hours"],
            first["bands"]["committed"]["hours"] + 16,
        )
        self.assertLessEqual(first["capacity"]["committed_scheduled_hours"], 134)
        self.assertEqual(first["imported_satisfied"]["ids"], sorted(first["imported_satisfied"]["ids"]))
        self.assertLessEqual(
            max(item["window"]["finish_productive_hour"] for item in first["bands"]["committed"]["schedule"]),
            42,
        )

    def test_every_id_is_classified_once_and_committed_is_dependency_closed(self):
        manifest = schedule_wave.build_manifest(self.registry_path, self.resource_path)
        schedule_wave.verify_manifest(manifest, self.registry, self.resources)
        ids = [mid for band in manifest["bands"].values() for mid in band["ids"]]
        registry_ids = [item["id"] for item in self.registry["milestones"]]
        self.assertCountEqual(ids, registry_ids)
        self.assertEqual(len(ids), len(set(ids)))
        self.assertNotIn("KQ-089", manifest["bands"]["committed"]["ids"])
        self.assertNotIn("KQ-097", manifest["bands"]["committed"]["ids"])

    def test_verifier_rejects_capacity_and_dependency_corruption(self):
        manifest = schedule_wave.build_manifest(self.registry_path, self.resource_path)
        over_capacity = deepcopy(manifest)
        forced_overhead = (
            over_capacity["policy"]["committed_capacity_hours"]
            - over_capacity["capacity"]["committed_milestone_hours"]
            + 1
        )
        over_capacity["capacity"]["review_synthesis_replan_overhead_hours"] = forced_overhead
        over_capacity["capacity"]["committed_scheduled_hours"] = (
            over_capacity["capacity"]["committed_milestone_hours"] + forced_overhead
        )
        with self.assertRaisesRegex(schedule_wave.ScheduleError, "exceeds 134"):
            schedule_wave.verify_manifest(over_capacity, self.registry, self.resources)

        dependency_registry = deepcopy(self.registry)
        for milestone in dependency_registry["milestones"]:
            if milestone["id"] == "KQ-013":
                milestone["milestone_status"] = "Pending"
        with tempfile.TemporaryDirectory() as directory:
            registry_path = Path(directory) / "registry.yaml"
            registry_path.write_text(yaml.safe_dump(dependency_registry, sort_keys=False), encoding="utf-8")
            broken_dependency = schedule_wave.build_manifest(registry_path, self.resource_path)
        scheduled = {
            item["id"]: item for item in broken_dependency["bands"]["committed"]["schedule"]
        }
        victim = next(
            item for item in scheduled.values() if any(dependency in scheduled for dependency in item["dependencies"])
        )
        scheduled_dependency = next(dependency for dependency in victim["dependencies"] if dependency in scheduled)
        victim["window"]["start_productive_hour"] = 0
        with self.assertRaisesRegex(schedule_wave.ScheduleError, f"starts before {scheduled_dependency}"):
            schedule_wave.verify_manifest(broken_dependency, dependency_registry, self.resources)

    def test_cli_regenerates_and_verifies_same_manifest(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "wave.yaml"
            args = ["--registry", str(self.registry_path), "--resources", str(self.resource_path), "--output", str(output)]
            self.assertEqual(schedule_wave.main(args), 0)
            generated = output.read_bytes()
            self.assertEqual(schedule_wave.main(args), 0)
            self.assertEqual(output.read_bytes(), generated)
            self.assertEqual(schedule_wave.main([*args, "--verify"]), 0)


if __name__ == "__main__":
    unittest.main()
