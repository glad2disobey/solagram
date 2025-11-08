import * as token from "@solana-program/token-2022";

import * as kit from "@solana/kit";

import * as clients from "../../clients/js/src/generated";

import * as lib from "../../client/lib";

const platformProgramClient = clients.solagram;
const tokenProgramClient = clients.token;
const applicationProgramClient = clients.application;

const { solagram, application } = lib.programs;

const rpcClient = lib.connection.getRpcClient();

export async function getPlayers(
  session: kit.Address,
  firstParticipant: kit.KeyPairSigner,
  secondParticipant: kit.KeyPairSigner,
): Promise<kit.KeyPairSigner[]> {
  const [
    platformSession,
    sessionAccount,
  ] = await Promise.all([
    solagram.pda.getPlatformSessionStatePDA(session),
    applicationProgramClient.fetchSessionState(rpcClient.rpc, session),
  ]);

  const sessionSignerList =
    await lib.programs.solagram.pda.getSessionSignerListStatePDA(platformSession);

  const sessionSignerListAccount =
    await platformProgramClient.fetchPubkeyList(rpcClient.rpc, sessionSignerList);

  const currentParticipantIndex = sessionAccount.data.grid.currentParticipantIndex;

  return sessionSignerListAccount.data.pubkeys[currentParticipantIndex] === firstParticipant.address
    ? [firstParticipant, secondParticipant] : [secondParticipant, firstParticipant];
}

export async function getPlayersTreasuries(
  firstPlayer: kit.Address,
  secondPlayer: kit.Address,
): Promise<kit.Address[]> {
  return Promise.all([
    solagram.pda.getTokenProfileTreasuryStatePDA(
      firstPlayer,
      tokenProgramClient.TOKEN_PROGRAM_ADDRESS,
    ),
    solagram.pda.getTokenProfileTreasuryStatePDA(
      secondPlayer,
      tokenProgramClient.TOKEN_PROGRAM_ADDRESS,
    ),
  ])
}

export async function getPlayersBalances(
  firstPlayer: kit.Address,
  secondPlayer: kit.Address,
): Promise<bigint[]> {
  const [firstPlayerTreasury, secondPlayerTreasury] =
    await getPlayersTreasuries(firstPlayer, secondPlayer);

  const playerTreasuryAccounts = await Promise.all([
    token.fetchToken(rpcClient.rpc, firstPlayerTreasury),
    token.fetchToken(rpcClient.rpc, secondPlayerTreasury),
  ]);

  return playerTreasuryAccounts.map(playerTreasuryAccount => playerTreasuryAccount.data.amount);
}

type MakeMoveFunctionType = (x: number, y: number, signer: kit.KeyPairSigner) => Promise<void>;
export async function makeMoveFactory(session: kit.Address): Promise<MakeMoveFunctionType> {
  return async function(x: number, y: number, signer: kit.KeyPairSigner) {
    const globalState = await lib.programs.token.pda.getGlobalStatePDA();
    const globalStateAccount = await tokenProgramClient.fetchGlobalState(rpcClient.rpc, globalState);

    await lib.programs.application.transations.session.makeMove({
      session,

      pluginAddress: tokenProgramClient.TOKEN_PROGRAM_ADDRESS,
      mint: globalStateAccount.data.mint,

      x,
      y,

      signer,
    });
  }
}

type CreateSessionType = { session: kit.Address, mint: kit.Address };
export async function createSession(
  participantWallets: kit.KeyPairSigner[],
  share: bigint,
): Promise<CreateSessionType> {
  const signerWallet = participantWallets[0];

  const [tokenPluginGlobalState, profilePendingSessionListState] = await Promise.all([
    lib.programs.token.pda.getGlobalStatePDA(),
    solagram.pda.getProfilePendingSessionListStatePDA(signerWallet.address),
  ]);
  
  const [
    tokenPluginGlobalStateAccount,
    profilePendingSessionListStateBeforeAccount,
  ] = await Promise.all([
    tokenProgramClient.fetchGlobalState(rpcClient.rpc, tokenPluginGlobalState),
    platformProgramClient.fetchPubkeyList(rpcClient.rpc, profilePendingSessionListState),
  ]);

  const mint = tokenPluginGlobalStateAccount.data.mint;

  const mintAccount = await token.fetchMint(rpcClient.rpc, mint);

  await application.transations.session.startSession({
    participants: participantWallets.map(wallet => wallet.address),

    tokenPlugin: tokenProgramClient.TOKEN_PROGRAM_ADDRESS,
    mint,
    share,

    transferFeeFlag: lib.token.hasExtension(mintAccount, "TransferFeeConfig"),

    initiator: signerWallet,
  });

  const profilePendingSessionListStateAfterAccount =
    await platformProgramClient.fetchPubkeyList(rpcClient.rpc, profilePendingSessionListState);

  const platformSession = profilePendingSessionListStateAfterAccount.data.pubkeys.find(x => 
    !profilePendingSessionListStateBeforeAccount.data.pubkeys.includes(x)
  );

  const platformSessionAccount = await platformProgramClient.fetchPlatformSessionState(rpcClient.rpc, platformSession);

  return {
    session: platformSessionAccount.data.innerSession,
    mint,
  };
}

type PrepareSessionFunctionType = {
  session: kit.Address,
  players: kit.KeyPairSigner[],
  makeMove: MakeMoveFunctionType,
}

export async function prepareSession(
  participantWallets: kit.KeyPairSigner[],
  share: bigint,
): Promise<PrepareSessionFunctionType> {
  const { session, mint } = await createSession(participantWallets, share);

  await Promise.all(participantWallets.map(wallet =>
    solagram.plugins.transactions.session.signPlatformSession({
      session,

      mint,

      signer: wallet,
    })
  ));

  const [firstParticipantWallet, secondParticipantWallet] = participantWallets;

  const [makeMove, players] = await Promise.all([
    makeMoveFactory(session),
    getPlayers(session, firstParticipantWallet, secondParticipantWallet),
  ]);

  return {
    session,
    makeMove,
    players,
  };
}
