import { before, describe, it } from "node:test";
import assert from "node:assert";

import * as kit from "@solana/kit";

import * as solagramProgramClient from "../../../clients/js/src/generated/solagram";

import * as lib from "../../../client/lib";
import * as mocks from "../../mocks";

const solagram = lib.programs.solagram;

describe("Profile", async () => {
  const rpcClient = lib.connection.getRpcClient();

  let adminWallet: kit.KeyPairSigner,

    aliceWallet: kit.KeyPairSigner,
    barryWallet: kit.KeyPairSigner,
    cindyWallet: kit.KeyPairSigner;

  before(async () => {
    adminWallet = await lib.wallet.getAdminWallet();

    aliceWallet = await lib.wallet.makeWallet(3_000_000_000n);
    barryWallet = await lib.wallet.makeWallet();
    cindyWallet = await lib.wallet.makeWallet(0n);
  });

  it("Create profiles", async () => {
    await solagram.transactions.profile.createProfile({ wallet: aliceWallet, name: "Alice" });
    await solagram.transactions.profile.createProfile({ wallet: barryWallet, name: "Barry" });
    
    await assert.rejects(solagram.transactions.profile.createProfile({ wallet: cindyWallet, name: "Cindy" }));

    await lib.wallet.airdropToWallet(cindyWallet, 1_000_000_000n);

    await assert.rejects(
      solagram.transactions.profile.createProfile({
        wallet: cindyWallet,
        name: "VeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryLongName",
      })
    );

    await solagram.transactions.profile.createProfile({ wallet: cindyWallet, name: "Cindy" });

    await assert.rejects(solagram.transactions.profile.createProfile({ wallet: barryWallet, name: "Barry" }));

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

    await assert.rejects(solagram.transactions.admin.installPlugin({
      wallet: adminWallet,
      plugin: applicationPlugin,
      pluginType: "abc" as "application",
    }));

    await solagram.transactions.admin.installPlugin({
      wallet: adminWallet,
      plugin: applicationPlugin,
      pluginType: "application",
    });

    await assert.rejects(solagram.transactions.admin.installPlugin({
      wallet: adminWallet,
      plugin: applicationPlugin,
      pluginType: "application",
    }));

    const plugins = await Promise.all(
      Array.from({ length: solagram.plugins.constants.MAX_COMMUNICATION_PLUGINS_COUNT - 1 })
        .map(() => mocks.plugin.createPlugin()
      )
    );

    await Promise.all(plugins.map(
      plugin => solagram.transactions.admin.installPlugin({
        wallet: adminWallet,
        plugin,
        pluginType: "application",
      })
    ));

    const outOfBoundsPlugin = await mocks.plugin.createPlugin();
    await assert.rejects(solagram.transactions.admin.installPlugin({
      wallet: adminWallet,
      plugin: outOfBoundsPlugin,
      pluginType: "application",
    }));

    const applicationPluginListPDA = await solagram.pda.getApplicationPluginListStatePDA();
    let applicationPluginListAccount = await solagramProgramClient
      .fetchPubkeyList(rpcClient.rpc, applicationPluginListPDA);

    for await (const plugin of applicationPluginListAccount.data.pubkeys) {
      await solagram.transactions.admin.uninstallPlugin({
        wallet: adminWallet,
        plugin,
        pluginType: "application",
      });
    }

    applicationPluginListAccount = await solagramProgramClient
      .fetchPubkeyList(rpcClient.rpc, applicationPluginListPDA);
    assert.deepStrictEqual(applicationPluginListAccount.data.pubkeys, []);
  });
});
