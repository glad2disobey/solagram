import { before, describe, it } from "node:test";
import assert from "node:assert";

import * as kit from "@solana/kit";

import * as solagramProgramClient from "../../../clients/js/src/generated/solagram";
import * as tokenProgramClient from "../../../clients/js/src/generated/token";
import * as applicationProgramClient from "../../../clients/js/src/generated/application";

import * as lib from "../../../client/lib";

const { solagram, application } = lib.programs;

const rpcClient = lib.connection.getRpcClient();

describe("Application", async () => {
  let adminWallet: kit.KeyPairSigner;
  let aliceWallet: kit.KeyPairSigner;
  let barryWallet: kit.KeyPairSigner;

  before(async () => {
    adminWallet = await lib.wallet.getAdminWallet();

    aliceWallet = await lib.wallet.makeWallet(3_000_000_000n);
    barryWallet = await lib.wallet.makeWallet();
  });

  it("Initialize application", async () => {
    await lib.programs.application.transations.initialize.initialize({
      admin: adminWallet,
    });
  });

  it("Install plugin", async () => {
    await solagram.transactions.admin.installPlugin({
      wallet: adminWallet,
      plugin: applicationProgramClient.APPLICATION_PROGRAM_ADDRESS,
      pluginType: "application",
    });
  });

  it("Start session", async () => {
    const tokenPluginListPDA = await lib.programs.solagram.pda.getTokenPluginListStatePDA();
    const tokenPluginList = await solagramProgramClient.fetchPubkeyList(rpcClient.rpc, tokenPluginListPDA);

    const tokenPluginAddress = tokenPluginList.data.pubkeys
      .find(tokenPlugin => tokenPlugin === tokenProgramClient.TOKEN_PROGRAM_ADDRESS);

    const tokenPluginGlobalStatePDA = await lib.programs.token.pda.getGlobalStatePDA();

    const tokenPlugin = await tokenProgramClient.fetchGlobalState(rpcClient.rpc, tokenPluginGlobalStatePDA);

    await application.transations.session.startSession({
      initiator: aliceWallet,
      participants: [adminWallet.address, barryWallet.address],
      share: 100n,
      tokenPlugin: tokenPluginAddress,
      mint: tokenPlugin.data.mint,
    });
  });
});
