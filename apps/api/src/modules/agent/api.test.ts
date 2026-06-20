import { describe, expect, test } from "bun:test";
import { agentContextOutputSchema } from "@pier-demo/api-contract";
import { agentContext } from "./api";

describe("agent context schema", () => {
  test("documents the counter template app topology", () => {
    expect(agentContextOutputSchema.parse(agentContext)).toEqual(agentContext);
  });
});
