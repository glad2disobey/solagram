import { before, describe, it } from "node:test";
import assert from "node:assert";

import * as kit from "@solana/kit";

import * as programClient from "../../../clients/js/src/generated";

import * as instructions from "./instructions";
import * as helpers from "../../helpers";
import * as mocks from "../../mocks";

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
  let aliceProfileAddress, barryProfileAddress, cindyProfileAddress: kit.Address;

  let globalStatePDA, communicationStatePDA: kit.Address;

  before(async () => {
    adminWallet = await helpers.wallet.makeWallet();

    aliceWallet = await helpers.wallet.makeWallet(3_000_000_000n);
    barryWallet = await helpers.wallet.makeWallet();
    cindyWallet = await helpers.wallet.makeWallet(0n);

    await checkFunds();
  });

  it("Initialize program", async () => {
    [globalStatePDA] = await instructions.initialize.initializeProgram(adminWallet);
  })

  it("Create profiles", async () => {
    aliceProfileAddress = await instructions.profile.createProfile(globalStatePDA, aliceWallet, "Alice");
    barryProfileAddress = await instructions.profile.createProfile(globalStatePDA, barryWallet, "Barry");
    
    await assert.rejects(instructions.profile.createProfile(globalStatePDA, cindyWallet, "Cindy"));
    await checkFunds();

    await helpers.wallet.airdropToWallet(cindyWallet, 1_000_000_000n);

    await assert.rejects(
      instructions.profile.createProfile(
        globalStatePDA,
        cindyWallet,
        "VeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryLongName",
      )
    );

    cindyProfileAddress = await instructions.profile.createProfile(globalStatePDA, cindyWallet, "Cindy");
    await checkFunds();

    await assert.rejects(instructions.profile.createProfile(globalStatePDA, barryWallet, "Barry"));
  });

  it("Install plugins", async () => {
    const communicationPlugin = await mocks.plugin.createPlugin();

    communicationStatePDA = await instructions.admin.installPlugin(
      adminWallet,
      globalStatePDA,
      communicationPlugin,
      "communication",
    );

    await assert.rejects(instructions.admin.installPlugin(adminWallet, globalStatePDA, communicationPlugin, "communication"));

    const plugins = await Promise.all(
      Array.from({ length: helpers.libs.plugins.constants.MAX_COMMUNICATION_PLUGINS_COUNT - 1 })
        .map(() => mocks.plugin.createPlugin()
      )
    );

    await Promise.all(plugins.map(
      plugin => instructions.admin.installPlugin(adminWallet, globalStatePDA, plugin, "communication")
    ));

    const outOfBoundsPlugin = await mocks.plugin.createPlugin();
    await assert.rejects(instructions.admin.installPlugin(adminWallet, globalStatePDA, outOfBoundsPlugin, "communication"));
  });

  it("Check profiles", async () => {
    const [aliceProfile, barryProfile, cindyProfile] = await programClient.fetchAllProfileState(rpcClient.rpc, [
      aliceProfileAddress,
      barryProfileAddress,
      cindyProfileAddress,
    ]);

    assert.equal(aliceProfile.data.name, "Alice");
    assert.equal(barryProfile.data.name, "Barry");
    assert.equal(cindyProfile.data.name, "Cindy");
  });
});
