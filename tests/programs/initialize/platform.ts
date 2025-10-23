import { before, describe, it } from "node:test";

import * as kit from "@solana/kit";

import * as lib from "../../../client/lib";

const solagram = lib.programs.solagram;

describe("Platform", async () => {

  let adminWallet: kit.KeyPairSigner;

  before(async () => {
    adminWallet = await lib.wallet.getAdminWallet();
  });

  it("Initialize platform", async () => {
    await solagram.transactions.initialize.initializePlatform({ admin: adminWallet });
  });
});
