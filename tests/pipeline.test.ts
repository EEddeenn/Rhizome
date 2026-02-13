import assert from "node:assert";
import { describe, it } from "node:test";
import { topologicalSort, defineStep } from "../scripts/pipeline/runner";

describe("pipeline runner", () => {
  describe("topologicalSort", () => {
    it("sorts steps in dependency order", () => {
      const steps = [
        defineStep({
          id: "c",
          name: "C",
          description: "",
          dependsOn: ["b"],
          run: async () => ({ success: true, artifacts: [] }),
        }),
        defineStep({
          id: "a",
          name: "A",
          description: "",
          dependsOn: [],
          run: async () => ({ success: true, artifacts: [] }),
        }),
        defineStep({
          id: "b",
          name: "B",
          description: "",
          dependsOn: ["a"],
          run: async () => ({ success: true, artifacts: [] }),
        }),
      ];

      const sorted = topologicalSort(steps);
      const ids = sorted.map((s: { id: string }) => s.id);
      
      assert.ok(ids.indexOf("a") < ids.indexOf("b"), "a should come before b");
      assert.ok(ids.indexOf("b") < ids.indexOf("c"), "b should come before c");
    });

    it("handles independent steps", () => {
      const steps = [
        defineStep({
          id: "a",
          name: "A",
          description: "",
          dependsOn: [],
          run: async () => ({ success: true, artifacts: [] }),
        }),
        defineStep({
          id: "b",
          name: "B",
          description: "",
          dependsOn: [],
          run: async () => ({ success: true, artifacts: [] }),
        }),
      ];

      const sorted = topologicalSort(steps);
      assert.strictEqual(sorted.length, 2);
    });

    it("throws on circular dependencies", () => {
      const steps = [
        defineStep({
          id: "a",
          name: "A",
          description: "",
          dependsOn: ["b"],
          run: async () => ({ success: true, artifacts: [] }),
        }),
        defineStep({
          id: "b",
          name: "B",
          description: "",
          dependsOn: ["a"],
          run: async () => ({ success: true, artifacts: [] }),
        }),
      ];

      assert.throws(() => topologicalSort(steps), /Circular dependency/);
    });

    it("throws on unknown dependencies", () => {
      const steps = [
        defineStep({
          id: "a",
          name: "A",
          description: "",
          dependsOn: ["unknown"],
          run: async () => ({ success: true, artifacts: [] }),
        }),
      ];

      assert.throws(() => topologicalSort(steps), /Unknown dependency/);
    });
  });

  describe("defineStep", () => {
    it("returns the step as-is", () => {
      const step = {
        id: "test",
        name: "Test",
        description: "A test step",
        dependsOn: [] as string[],
        run: async () => ({ success: true, artifacts: [] }),
      };

      const defined = defineStep(step);
      assert.strictEqual(defined.id, "test");
      assert.strictEqual(defined.name, "Test");
    });
  });
});
