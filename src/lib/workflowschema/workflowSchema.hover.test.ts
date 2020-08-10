import { Context } from "../../types";
import { ContextProviderFactory } from "../parser/complete";
import { hover } from "../parser/hover";
import { Workflow } from "../parser/parser";
import { PropertyPath } from "../utils/path";
import { EditContextProvider } from "./contextProvider";
import { _getSchema } from "./workflowSchema";

const context: Context = {
  client: null,
  owner: "owner",
  repository: "repository",
};
const WorkflowSchema = _getSchema(context);
const ExpressionContextProviderFactory: ContextProviderFactory = {
  get: async (workflow: Workflow, path: PropertyPath) =>
    new EditContextProvider(workflow, path, []),
};

describe("Hover", () => {
  /** | in string denotes cursor position */
  const testHover = async (input: string) => {
    const pos = input.indexOf("|");
    input = input.replace("|", "");
    return await hover(
      input,
      pos,
      WorkflowSchema,
      ExpressionContextProviderFactory
    );
  };

  /** | in string denotes cursor position */
  const hoverSimple = async (input: string, expected: string) => {
    const hover = await testHover(input);

    expect(hover).not.toBeUndefined();
    expect(hover.description).toEqual(expected);
  };

  describe("values", () => {
    it("description for event", () =>
      hoverSimple(
        "on: check|_run",
        "Runs your workflow anytime the check_run event occurs. More than one activity type triggers this event. " +
          "For information about the REST API, see https://developer.github.com/v3/checks/runs."
      ));

    it("description for inline sequence", () =>
      hoverSimple(
        "on: [ push, check|_run ]",
        "Runs your workflow anytime the check_run event occurs. More than one activity type triggers this event. " +
          "For information about the REST API, see https://developer.github.com/v3/checks/runs."
      ));

    it("description for event in sequence", () =>
      hoverSimple(
        "on:\n  - check|_run",
        "Runs your workflow anytime the check_run event occurs. More than one activity type triggers this event. " +
          "For information about the REST API, see https://developer.github.com/v3/checks/runs."
      ));
  });

  describe("keys", () => {
    it("description for event using map", () =>
      hoverSimple(
        "on:\n  check|_run:",
        "Runs your workflow anytime the check_run event occurs. More than one activity type triggers this event. " +
          "For information about the REST API, see https://developer.github.com/v3/checks/runs."
      ));

    it("description for event using map", () =>
      hoverSimple(
        "on: push\njobs:\n  build:\n    runs|-on: ubuntu-latest",
        "The type of machine to run the job on. The machine can be either a GitHub-hosted runner, or a self-hosted runner."
      ));
  });

  describe("expressions", () => {
    it("evaluates simple expressions", () =>
      hoverSimple(
        `env:
  WF_VALUE: 42
jobs:
  build:
    name: \${{ env.WF|_VALUE }}`,
        "Evaluates to: `42`"
      ));

    it("evaluates multiple expressions", () =>
      hoverSimple(
        `env:
  WF_VALUE: 42
  WF2: 23
jobs:
  build:
    name: \${{ env.WF|_VALUE }} -- \${{ env.WF2 }}`,
        "Evaluates to: `42 -- 23`"
      ));

    it("evaluates complex expressions", () =>
      hoverSimple(
        `env:
  WF_VALUE: 42
  WF2: 23
jobs:
  build:
    name: \${{ env.WF|_VALUE == env.WF2 }}`,
        "Evaluates to: `false`"
      ));

    it("evaluates expression with referencing env variables", () =>
      hoverSimple(
        `on:\n  push:\n
env:
  WF_VALUE: 42
  WF2: \${{ github.event.ref }}
jobs:
  build:
    name: \${{ env.W|F2 }}`,
        "Evaluates to: `refs/tags/simple-tag`"
      ));
  });
});