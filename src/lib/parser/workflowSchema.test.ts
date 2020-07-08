import { complete } from "./complete";
import { parse } from "./parser";
import { events, WorkflowSchema } from "./workflowSchema";

describe("Completion", () => {
  /** | in string denotes cursor position */
  const testComplete = async (input: string) => {
    const pos = input.indexOf("|");
    input = input.replace("|", "");
    const doc = parse(input, WorkflowSchema);
    return await complete(doc, pos, input);
  };

  /** | in string denotes cursor position */
  const completeSimple = async (input: string, expected: string[]) => {
    const suggestions = await testComplete(input);

    expect(suggestions.map((x) => x.value)).toEqual(expected);
  };

  describe("map", () => {
    it("completes top level keys", async () => {
      await completeSimple("|", ["env", "jobs", "name", "on"]);
      await completeSimple("n|", ["name"]);

      await completeSimple("name: workflow\n|", ["env", "jobs", "on"]);
    });

    it("complete top level key in workflow", () =>
      completeSimple(
        "name: test\non:\n  pull_request:\n    types:\n    - assigned\n|",
        ["env", "jobs"]
      ));
  });

  describe("on", () => {
    it("value", async () => {
      await completeSimple(
        "on: |",
        events.map((x) => x.value)
      );
    });

    it("value with partial input", async () => {
      await completeSimple("on: check_r|", ["check_run"]);
    });

    it("map", async () => {
      await completeSimple(
        "on:\n  |",
        events.map((x) => x.value)
      );
    });

    it("map with partial input", async () => {
      await completeSimple("on:\n  check_|", ["check_run", "check_suite"]);
    });

    it("sequence", async () => {
      await completeSimple(
        "on:\n  - |",
        events.map((x) => x.value)
      );
    });

    it("types", async () => {
      await completeSimple("on:\n  issues:\n    types:\n      - |", [
        "assigned",
        "closed",
        "deleted",
        "demilestoned",
        "edited",
        "labeled",
        "locked",
        "milestoned",
        "opened",
        "pinned",
        "reopened",
        "transferred",
        "unassigned",
        "unlabeled",
        "unlocked",
        "unpinned",
      ]);
    });
  });

  describe("job", () => {
    it("completes top-level keys", async () => {
      await completeSimple("jobs:\n  build:\n    |", [
        "env",
        "runs-on",
        "steps",
      ]);
    });

    it("completes top-level keys with existing", async () => {
      await completeSimple(
        "jobs:\n  build:\n    runs-on: ubuntu-latest\n    |",
        ["env", "steps"]
      );
    });
  });
});