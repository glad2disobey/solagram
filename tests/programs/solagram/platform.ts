import { before, describe, it } from "node:test";
import assert from "node:assert";

import * as kit from "@solana/kit";

import * as solagramProgramClient from "../../../clients/js/src/generated/solagram";

import * as helpers from "../../helpers";
import * as mocks from "../../mocks";

const solagram = helpers.programs.solagram;

describe("profile", async () => {
  const rpcClient = helpers.connection.getRpcClient();

  async function checkFunds() {
    const [aliceBalance, barryBalance, cindyBalance] = await Promise.all(
      [aliceWallet, barryWallet, cindyWallet]
        .map(wallet => rpcClient.rpc.getBalance(wallet.address).send())
    );

    console.log("Alice's balance: ", aliceBalance);
    console.log("Barry's balance: ", barryBalance);
    console.log("Cindy's balance: ", cindyBalance);
  }

  let adminWallet: kit.KeyPairSigner;
  let aliceWallet, barryWallet, cindyWallet: kit.KeyPairSigner;

  before(async () => {
    adminWallet = await helpers.wallet.getAdminWallet();

    aliceWallet = await helpers.wallet.makeWallet(3_000_000_000n);
    barryWallet = await helpers.wallet.makeWallet();
    cindyWallet = await helpers.wallet.makeWallet(0n);

    await checkFunds();
  });

  it("Initialize program", async () => {
    await solagram.instructions.initialize.initializeProgram(adminWallet);
  })

  it("Create profiles", async () => {
    await solagram.instructions.profile.createProfile(aliceWallet, "Alice");
    await solagram.instructions.profile.createProfile(barryWallet, "Barry");
    
    await assert.rejects(solagram.instructions.profile.createProfile(cindyWallet, "Cindy"));
    await checkFunds();

    await helpers.wallet.airdropToWallet(cindyWallet, 1_000_000_000n);

    await assert.rejects(
      solagram.instructions.profile.createProfile(
        cindyWallet,
        "VeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryLongName",
      )
    );

    await solagram.instructions.profile.createProfile(cindyWallet, "Cindy");
    await checkFunds();

    await assert.rejects(solagram.instructions.profile.createProfile(barryWallet, "Barry"));

    const [aliceProfile, barryProfile, cindyProfile] = await solagramProgramClient.fetchAllProfileState(
      rpcClient.rpc,

      await Promise.all([
        solagram.pda.getProfileStatePDA(aliceWallet.address),
        solagram.pda.getProfileStatePDA(barryWallet.address),
        solagram.pda.getProfileStatePDA(cindyWallet.address),
      ])
    );

    assert.equal(aliceProfile.data.name, "Alice");
    assert.equal(barryProfile.data.name, "Barry");
    assert.equal(cindyProfile.data.name, "Cindy");
  });

  it("Install plugins", async () => {
    const applicationPlugin = await mocks.plugin.createPlugin();

    await assert.rejects(solagram.instructions.admin.installPlugin(
      adminWallet,
      applicationPlugin,
      "abc" as "application",
    ));

    await solagram.instructions.admin.installPlugin(
      adminWallet,
      applicationPlugin,
      "application",
    );

    await assert.rejects(solagram.instructions.admin.installPlugin(adminWallet, applicationPlugin, "application"));

    const plugins = await Promise.all(
      Array.from({ length: solagram.plugins.constants.MAX_COMMUNICATION_PLUGINS_COUNT - 1 })
        .map(() => mocks.plugin.createPlugin()
      )
    );

    await Promise.all(plugins.map(
      plugin => solagram.instructions.admin.installPlugin(adminWallet, plugin, "application")
    ));

    const outOfBoundsPlugin = await mocks.plugin.createPlugin();
    await assert.rejects(solagram.instructions.admin.installPlugin(adminWallet, outOfBoundsPlugin, "application"));
  });
});
