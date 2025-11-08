import { before, describe, it } from "node:test";
import assert from "node:assert";

import * as token from "@solana-program/token-2022";

import * as kit from "@solana/kit";

import * as platformProgramClient from "../../../clients/js/src/generated/solagram";
import * as tokenProgramClient from "../../../clients/js/src/generated/token";
import * as applicationProgramClient from "../../../clients/js/src/generated/application";

import * as lib from "../../../client/lib";

import * as helpers from "../../helpers";

const { solagram, application } = lib.programs;

const rpcClient = lib.connection.getRpcClient();

describe("Application", async () => {
  let adminWallet: kit.KeyPairSigner;
  let aliceWallet: kit.KeyPairSigner;
  let barryWallet: kit.KeyPairSigner;

  let firstPlayerWallet: kit.KeyPairSigner;
  let secondPlayerWallet: kit.KeyPairSigner;

  let tokenPluginAccount: kit.Account<tokenProgramClient.GlobalState, string>;
  let mintAccount: kit.Account<token.Mint>;

  let session: kit.Address;

  let platformSessionAccount: kit.Account<platformProgramClient.PlatformSessionState, string>;

  before(async () => {
    [adminWallet, aliceWallet, barryWallet] = await Promise.all([
      helpers.wallet.getAdminWallet(),
      helpers.wallet.makeWallet(5_000_000_000n),
      helpers.wallet.makeWallet(),
    ]);
  });

  it("Initialize application", async () => {
    await lib.programs.application.transations.initialize.initialize({
      admin: adminWallet,
    });
  });

  it("Create profiles", async () => {
    await Promise.all([
      solagram.transactions.profile.createProfile({ wallet: aliceWallet, name: "Alice" }),
      solagram.transactions.profile.createProfile({ wallet: barryWallet, name: "Barry" }),
    ]);
  });

  it("Install plugin", async () => {
    await solagram.transactions.admin.installPlugin({
      wallet: adminWallet,
      plugin: applicationProgramClient.APPLICATION_PROGRAM_ADDRESS,
      pluginType: "application",
    });
  });

  it("Start session", async () => {
    const [tokenPluginListState, tokenPluginGlobalState] = await Promise.all([
      lib.programs.solagram.pda.getTokenPluginListStatePDA(),
      lib.programs.token.pda.getGlobalStatePDA(),
    ]);

    const tokenPluginListStateAccount = await platformProgramClient.fetchPubkeyList(rpcClient.rpc, tokenPluginListState);

    const tokenPlugin = tokenPluginListStateAccount.data.pubkeys
      .find(tokenPlugin => tokenPlugin === tokenProgramClient.TOKEN_PROGRAM_ADDRESS);

    tokenPluginAccount = await tokenProgramClient.fetchGlobalState(rpcClient.rpc, tokenPluginGlobalState);

    mintAccount = await token.fetchMint(rpcClient.rpc, tokenPluginAccount.data.mint);

    await application.transations.session.startSession({
      initiator: aliceWallet,
      participants: [aliceWallet.address, barryWallet.address],
      share: 10n,
      tokenPlugin: tokenPlugin,
      mint: tokenPluginAccount.data.mint,
      transferFeeFlag: lib.token.hasExtension(mintAccount, "TransferFeeConfig"),
    });
  });

  it("Sign session", async () => {
    const [aliceSessionList, barrySessionList] = await Promise.all([
      solagram.pda.getProfilePendingSessionListStatePDA(aliceWallet.address),
      solagram.pda.getProfilePendingSessionListStatePDA(barryWallet.address),
    ]);

    const [aliceSessionListAccount, barrySessionListAccount] = await Promise.all([
      platformProgramClient.fetchPubkeyList(rpcClient.rpc, aliceSessionList),
      platformProgramClient.fetchPubkeyList(rpcClient.rpc, barrySessionList),
    ]);

    const platformSession = aliceSessionListAccount.data.pubkeys[0];

    assert.equal(platformSession, barrySessionListAccount.data.pubkeys[0]);

    platformSessionAccount = await platformProgramClient.fetchPlatformSessionState(rpcClient.rpc, platformSession);

    session = platformSessionAccount.data.innerSession;

    await assert.rejects(application.transations.session.makeMove({
      session,

      pluginAddress: tokenProgramClient.TOKEN_PROGRAM_ADDRESS,
      mint: tokenPluginAccount.data.mint,

      x: 1,
      y: 1,

      signer: aliceWallet,
    }));

    await solagram.plugins.transactions.session.signPlatformSession({
      session,

      mint: tokenPluginAccount.data.mint,

      signer: aliceWallet,
    });

    await assert.rejects(solagram.plugins.transactions.session.signPlatformSession({
      session,

      mint: tokenPluginAccount.data.mint,

      signer: aliceWallet,
    }));

    await assert.rejects(application.transations.session.makeMove({
      session,

      pluginAddress: tokenProgramClient.TOKEN_PROGRAM_ADDRESS,
      mint: tokenPluginAccount.data.mint,

      x: 1,
      y: 1,

      signer: aliceWallet,
    }));

    await solagram.plugins.transactions.session.signPlatformSession({
      session,

      mint: tokenPluginAccount.data.mint,

      signer: barryWallet,
    });
  });

  it("Make move", async () => {
    [firstPlayerWallet, secondPlayerWallet] = await helpers.application.getPlayers(session, aliceWallet, barryWallet);

    await assert.rejects(application.transations.session.makeMove({
      session,

      pluginAddress: tokenProgramClient.TOKEN_PROGRAM_ADDRESS,
      mint: tokenPluginAccount.data.mint,

      x: 1,
      y: 1,

      signer: secondPlayerWallet,
    }));

    await assert.rejects(application.transations.session.makeMove({
      session,

      pluginAddress: tokenProgramClient.TOKEN_PROGRAM_ADDRESS,
      mint: tokenPluginAccount.data.mint,

      x: 1,
      y: 3,

      signer: firstPlayerWallet,
    }));

    await application.transations.session.makeMove({
      session,

      pluginAddress: tokenProgramClient.TOKEN_PROGRAM_ADDRESS,
      mint: tokenPluginAccount.data.mint,

      x: 1,
      y: 1,

      signer: firstPlayerWallet,
    });

    await assert.rejects(application.transations.session.makeMove({
      session,

      pluginAddress: tokenProgramClient.TOKEN_PROGRAM_ADDRESS,
      mint: tokenPluginAccount.data.mint,

      x: 1,
      y: 1,

      signer: secondPlayerWallet,
    }));
  });

  it("Diagonal win condition", async () => {
    const makeMove = await helpers.application.makeMoveFactory(session);

    const [firstPlayerBeforeBalance, secondPlayerBeforeBalance] =
      await helpers.application.getPlayersBalances(firstPlayerWallet.address, secondPlayerWallet.address);

    await makeMove(2, 0, secondPlayerWallet);
    await makeMove(2, 2, firstPlayerWallet);
    await makeMove(0, 2, secondPlayerWallet);
    await makeMove(0, 0, firstPlayerWallet);

    const [firstPlayerAfterBalance, secondPlayerAfterBalance] =
      await helpers.application.getPlayersBalances(firstPlayerWallet.address, secondPlayerWallet.address);

    assert.notEqual(firstPlayerBeforeBalance, firstPlayerAfterBalance);
    assert.equal(secondPlayerBeforeBalance, secondPlayerAfterBalance);
  });

  it("Horizontal win condition", async () => {
    const {
      session,
      makeMove,
      players: [firstPlayerWallet, secondPlayerWallet],
    } = await helpers.application.prepareSession([barryWallet, aliceWallet], 20n);

    const [firstPlayerBeforeBalance, secondPlayerBeforeBalance] =
      await helpers.application.getPlayersBalances(firstPlayerWallet.address, secondPlayerWallet.address);

    await makeMove(1, 0, firstPlayerWallet);
    await makeMove(0, 2, secondPlayerWallet);
    await makeMove(1, 1, firstPlayerWallet);
    await makeMove(1, 2, secondPlayerWallet);
    await makeMove(0, 0, firstPlayerWallet);
    await makeMove(2, 2, secondPlayerWallet);

    const [firstPlayerAfterBalance, secondPlayerAfterBalance] =
      await helpers.application.getPlayersBalances(firstPlayerWallet.address, secondPlayerWallet.address);

    assert.equal(firstPlayerBeforeBalance, firstPlayerAfterBalance);
    assert.notEqual(secondPlayerBeforeBalance, secondPlayerAfterBalance);
  });

  it("Vertical win condition", async () => {
    const {
      session,
      makeMove,
      players: [firstPlayerWallet, secondPlayerWallet],
    } = await helpers.application.prepareSession([barryWallet, aliceWallet], 10n);

    const [firstPlayerBeforeBalance, secondPlayerBeforeBalance] =
      await helpers.application.getPlayersBalances(firstPlayerWallet.address, secondPlayerWallet.address);

    await makeMove(2, 0, firstPlayerWallet);
    await makeMove(0, 2, secondPlayerWallet);
    await makeMove(2, 1, firstPlayerWallet);
    await makeMove(1, 2, secondPlayerWallet);
    await makeMove(2, 2, firstPlayerWallet);

    const [firstPlayerAfterBalance, secondPlayerAfterBalance] =
      await helpers.application.getPlayersBalances(firstPlayerWallet.address, secondPlayerWallet.address);

    assert.notEqual(firstPlayerBeforeBalance, firstPlayerAfterBalance);
    assert.equal(secondPlayerBeforeBalance, secondPlayerAfterBalance);
  });

  it("Draw condition", async () => {
    const {
      session,
      makeMove,
      players: [firstPlayerWallet, secondPlayerWallet],
    } = await helpers.application.prepareSession([barryWallet, aliceWallet], 30n);

    const [firstPlayerBeforeBalance, secondPlayerBeforeBalance] =
      await helpers.application.getPlayersBalances(firstPlayerWallet.address, secondPlayerWallet.address);

    await makeMove(1, 1, firstPlayerWallet);
    await makeMove(0, 0, secondPlayerWallet);
    await makeMove(2, 0, firstPlayerWallet);
    await makeMove(0, 2, secondPlayerWallet);
    await makeMove(0, 1, firstPlayerWallet);
    await makeMove(2, 1, secondPlayerWallet);
    await makeMove(1, 0, firstPlayerWallet);
    await makeMove(1, 2, secondPlayerWallet);
    await makeMove(2, 2, firstPlayerWallet);

    const [firstPlayerAfterBalance, secondPlayerAfterBalance] =
      await helpers.application.getPlayersBalances(firstPlayerWallet.address, secondPlayerWallet.address);

    assert.notEqual(firstPlayerBeforeBalance, firstPlayerAfterBalance);
    assert.notEqual(secondPlayerBeforeBalance, secondPlayerAfterBalance);
  });

  it("Abort session", async () => {
    const share = 10n;

    const { session, mint } = await helpers.application.createSession([aliceWallet, barryWallet], share);

    const [aliceBeforeBalance, barryBeforeBalance] =
      await helpers.application.getPlayersBalances(aliceWallet.address, barryWallet.address);

    await solagram.plugins.transactions.session.signPlatformSession({ session, mint, signer: barryWallet });

    await solagram.plugins.transactions.session.abortPlatformSession({
      session,

      tokenPlugin: tokenProgramClient.TOKEN_PROGRAM_ADDRESS,
      mint,

      signer: aliceWallet,
    });

    const [aliceAfterBalance, barryAfterBalance] =
      await helpers.application.getPlayersBalances(aliceWallet.address, barryWallet.address);

      assert.equal(aliceBeforeBalance, aliceAfterBalance);
      assert.ok(barryBeforeBalance - barryAfterBalance < share);
  });

  it("Resign", async () => {
    const {
      session,
      makeMove,
      players: [firstPlayerWallet, secondPlayerWallet],
    } = await helpers.application.prepareSession([barryWallet, aliceWallet], 10n);

    const [firstPlayerBeforeBalance, secondPlayerBeforeBalance] =
      await helpers.application.getPlayersBalances(firstPlayerWallet.address, secondPlayerWallet.address);

    await makeMove(2, 0, firstPlayerWallet);
    await makeMove(0, 2, secondPlayerWallet);
    await makeMove(2, 1, firstPlayerWallet);
    await makeMove(1, 2, secondPlayerWallet);

    await application.transations.session.resign({
      session,

      pluginAddress: tokenProgramClient.TOKEN_PROGRAM_ADDRESS,
      mint: tokenPluginAccount.data.mint,

      signer: firstPlayerWallet,
    });

    const [firstPlayerAfterBalance, secondPlayerAfterBalance] =
      await helpers.application.getPlayersBalances(firstPlayerWallet.address, secondPlayerWallet.address);

    assert.equal(firstPlayerBeforeBalance, firstPlayerAfterBalance);
    assert.notEqual(secondPlayerBeforeBalance, secondPlayerAfterBalance);
  });
});
