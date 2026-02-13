import assert from "node:assert";
import { describe, it } from "node:test";
import { topologicalSort } from "../scripts/pipeline/runner";
import type { Step } from "../scripts/pipeline/types";

describe("pipeline runner", () => {
  describe("topologicalSort", () => {
    it("sorts steps in dependency order", () => {
      const steps: Step[] = [
        {
          id: "c",
          name: "C",
          description: "",
          dependsOn: ["b"],
          run: async () => ({ success: true, artifacts: [] }),
        },
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
      ];

      const sorted = topologicalSort(steps);
      const ids = sorted.map((s) => s.id);
      
      assert.ok(ids.indexOf("a") < ids.indexOf("b"), "a should come before b");
      assert.ok(ids.indexOf("b") < ids.indexOf("c"), "b should come before c");
    });

    it("handles independent steps", () => {
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
      ];

      const sorted = topologicalSort(steps);
      assert.strictEqual(sorted.length, 2);
    });

    it("throws on circular dependencies", () => {
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

      assert.throws(() => topologicalSort(steps), /Circular dependency/);
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

      assert.throws(() => topologicalSort(steps), /Unknown dependency/);
    });
  });
});
