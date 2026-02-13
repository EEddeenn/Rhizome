import assert from "node:assert";
import { describe, it } from "node:test";
import { groupStepsByLevel } from "../scripts/pipeline/runner";
import type { Step } from "../scripts/pipeline/types";

describe("pipeline runner", () => {
  describe("groupStepsByLevel", () => {
    it("groups independent steps at level 0", () => {
      const steps: Step[] = [
        {
          id: "a",
          name: "A",
          description: "",
          dependsOn: [],
          run: async () => ({ success: true, artifacts: [] }),
        },
        {
          id: "b",
          name: "B",
          description: "",
          dependsOn: [],
          run: async () => ({ success: true, artifacts: [] }),
        },
        {
          id: "c",
          name: "C",
          description: "",
          dependsOn: [],
          run: async () => ({ success: true, artifacts: [] }),
        },
      ];

      const levels = groupStepsByLevel(steps);
      assert.strictEqual(levels.length, 1);
      assert.strictEqual(levels[0].level, 0);
      assert.strictEqual(levels[0].steps.length, 3);
    });

    it("groups dependent steps at higher levels", () => {
      const steps: Step[] = [
        {
          id: "vendor",
          name: "Vendor",
          description: "",
          dependsOn: [],
          run: async () => ({ success: true, artifacts: [] }),
        },
        {
          id: "manifest",
          name: "Manifest",
          description: "",
          dependsOn: [],
          run: async () => ({ success: true, artifacts: [] }),
        },
        {
          id: "backlinks",
          name: "Backlinks",
          description: "",
          dependsOn: ["manifest"],
          run: async () => ({ success: true, artifacts: [] }),
        },
        {
          id: "tags",
          name: "Tags",
          description: "",
          dependsOn: ["manifest"],
          run: async () => ({ success: true, artifacts: [] }),
        },
      ];

      const levels = groupStepsByLevel(steps);
      assert.strictEqual(levels.length, 2);
      
      assert.strictEqual(levels[0].level, 0);
      assert.strictEqual(levels[0].steps.length, 2);
      const level0Ids = levels[0].steps.map(s => s.id);
      assert.ok(level0Ids.includes("vendor"));
      assert.ok(level0Ids.includes("manifest"));
      
      assert.strictEqual(levels[1].level, 1);
      assert.strictEqual(levels[1].steps.length, 2);
      const level1Ids = levels[1].steps.map(s => s.id);
      assert.ok(level1Ids.includes("backlinks"));
      assert.ok(level1Ids.includes("tags"));
    });

    it("handles multi-level dependency chains", () => {
      const steps: Step[] = [
        {
          id: "a",
          name: "A",
          description: "",
          dependsOn: [],
          run: async () => ({ success: true, artifacts: [] }),
        },
        {
          id: "b",
          name: "B",
          description: "",
          dependsOn: ["a"],
          run: async () => ({ success: true, artifacts: [] }),
        },
        {
          id: "c",
          name: "C",
          description: "",
          dependsOn: ["b"],
          run: async () => ({ success: true, artifacts: [] }),
        },
      ];

      const levels = groupStepsByLevel(steps);
      assert.strictEqual(levels.length, 3);
      assert.strictEqual(levels[0].level, 0);
      assert.strictEqual(levels[0].steps[0].id, "a");
      assert.strictEqual(levels[1].level, 1);
      assert.strictEqual(levels[1].steps[0].id, "b");
      assert.strictEqual(levels[2].level, 2);
      assert.strictEqual(levels[2].steps[0].id, "c");
    });

    it("throws on unknown dependencies", () => {
      const steps: Step[] = [
        {
          id: "a",
          name: "A",
          description: "",
          dependsOn: ["unknown"],
          run: async () => ({ success: true, artifacts: [] }),
        },
      ];

      assert.throws(() => groupStepsByLevel(steps), /Unknown step/);
    });

    it("detects circular dependencies", () => {
      const steps: Step[] = [
        {
          id: "a",
          name: "A",
          description: "",
          dependsOn: ["b"],
          run: async () => ({ success: true, artifacts: [] }),
        },
        {
          id: "b",
          name: "B",
          description: "",
          dependsOn: ["a"],
          run: async () => ({ success: true, artifacts: [] }),
        },
      ];

      assert.throws(() => groupStepsByLevel(steps), /Maximum call stack/);
    });
  });
});
