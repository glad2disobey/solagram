import { before, describe, it } from "node:test";

import * as kit from "@solana/kit";

import * as helpers from "../../helpers";

const solagram = helpers.programs.solagram;

describe("profile", async () => {

  let adminWallet: kit.KeyPairSigner;

  before(async () => {
    adminWallet = await helpers.wallet.getAdminWallet();
  });

  it("Initialize program", async () => {
    await solagram.instructions.initialize.initializeProgram(adminWallet);
  });
});
