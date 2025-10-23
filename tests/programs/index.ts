import { describe } from "node:test";

describe("Programs", async () => {
  await import("./initialize");
  await import("./solagram");
  await import("./messenger");
  await import("./token");
  await import("./application");
});
