import { describe } from "node:test";

describe("Programs", async () => {
  await import("./solagram");
  await import("./messenger");
});
