import { before, describe, it } from "node:test";

import * as kit from "@solana/kit";

import * as lib from "../../../client/lib";

import * as helpers from "../../helpers";

const solagram = lib.programs.solagram;

describe("Platform", async () => {

  let adminWallet: kit.KeyPairSigner;

  before(async () => {
    adminWallet = await helpers.wallet.getAdminWallet();
  });

  it("Initialize platform", async () => {
    await solagram.transactions.initialize.initializePlatform({ admin: adminWallet });
  });
});
