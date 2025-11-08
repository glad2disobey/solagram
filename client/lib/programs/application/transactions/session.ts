import * as kit from "@solana/kit";

import * as clients from "../../../../../clients/js/src/generated";

import * as pda from "../pda";
import * as platformPDA from "../../solagram/pda";

import * as connection from "../../../connection";
import * as transaction from "../../../transaction";

import * as application from "../instructions";
import * as pluginInstructions from "../../solagram/plugins/instructions";

const applicationProgramClient = clients.application;
const platformProgramClient = clients.solagram;

const rpcClient = connection.getRpcClient();

interface StartSessionInterface {
  tokenPlugin: kit.Address,
  mint: kit.Address,
  share: bigint,

  transferFeeFlag: boolean,

  participants: kit.Address[],

  initiator: kit.KeyPairSigner,
};

export async function startSession(options: StartSessionInterface, commitment: kit.Commitment = "confirmed") {
  const globalState = await pda.getGlobalStatePDA();
  const globalStateAccount = await applicationProgramClient.fetchGlobalState(rpcClient.rpc, globalState);

  const sessionCounter = globalStateAccount.data.sessionCounter;

  const sessionState = await pda.getSessionStatePDA(sessionCounter);

  const [
    startSessionInstruction,
    registerPlatformSessionInstruction,
    invitePlatformSessionInstructions,
  ] = await Promise.all([
    application.session.getStartSessionInstruction({
      initiator: options.initiator,
    }),
    pluginInstructions.session.getRegisterPlatformSessionInstruction({
      applicationPlugin: applicationProgramClient.APPLICATION_PROGRAM_ADDRESS,
      sessionState,
  
      tokenPlugin: options.tokenPlugin,
      mint: options.mint,
      share: options.share,

      transferFeeFlag: options.transferFeeFlag,
  
      participants: options.participants,
      sessionCounter,
  
      initiator: options.initiator,
    }),
    Promise.all(
      options.participants.map(participant => pluginInstructions.session.getInvitePlatformSessionInstruction({
        session: sessionState,
        participant,
  
        signer: options.initiator,
      }))
    ),
  ]);

  await transaction.execute([options.initiator], [
    startSessionInstruction,
    registerPlatformSessionInstruction,

    ...invitePlatformSessionInstructions,
  ], commitment);
}

interface MakeMoveInterface {
  session: kit.Address,

  pluginAddress: kit.Address,
  mint: kit.Address,

  x: number,
  y: number,

  signer: kit.KeyPairSigner,
}

export async function makeMove(options: MakeMoveInterface, commitment: kit.Commitment = "confirmed") {
  const [platformSessionState, platformTokenTreasuryState] = await Promise.all([
    platformPDA.getPlatformSessionStatePDA(options.session),
    platformPDA.getPlatformTokenTreasuryStatePDA(options.pluginAddress),
  ]);

  const [
    platformSessionStateAccount,
    sessionTreasuryState,
    sessionSignerListState,
    sessionParticipantListState,
  ] = await Promise.all([
    platformProgramClient.fetchPlatformSessionState(rpcClient.rpc, platformSessionState),
    platformPDA.getSessionTreasuryStatePDA(platformSessionState),
    platformPDA.getSessionSignerListStatePDA(platformSessionState),
    platformPDA.getSessionParticipantListStatePDA(platformSessionState)
  ]);

  const initiator = platformSessionStateAccount.data.initiatiorAddress;

  const makeMoveInstruciton = await application.session.getMakeMoveInstruction({
    session: options.session,

    sessionTreasuryState,
    sessionSignerListState,
    sessionParticipantListState,

    platformSessionState,
    platformTokenTreasuryState,

    mint: options.mint,

    initiator,

    x: options.x,
    y: options.y,

    signer: options.signer,
  });

  const sessionParticipantListStateAccount =
    await platformProgramClient.fetchPubkeyList(rpcClient.rpc, sessionParticipantListState);

  const sessionParticipantList = sessionParticipantListStateAccount.data.pubkeys;

  const tokenProfileTreasuryStateList = await Promise.all(
    sessionParticipantList.map(participant =>
      platformPDA.getTokenProfileTreasuryStatePDA(
        participant,
        platformSessionStateAccount.data.interest.tokenPlugin,
      )
    )
  );

  tokenProfileTreasuryStateList.forEach(tokenProfileTreasuryState => {
    makeMoveInstruciton.accounts.push({
      address: tokenProfileTreasuryState,
      role: kit.AccountRole.WRITABLE,
    });
  });

  await transaction.execute([options.signer], [makeMoveInstruciton], commitment);
}

interface ResignInterface {
  session: kit.Address,

  pluginAddress: kit.Address,
  mint: kit.Address,

  signer: kit.KeyPairSigner,
}

export async function resign(options: ResignInterface, commitment: kit.Commitment = "confirmed") {
  const [platformSessionState, platformTokenTreasuryState] = await Promise.all([
    platformPDA.getPlatformSessionStatePDA(options.session),
    platformPDA.getPlatformTokenTreasuryStatePDA(options.pluginAddress),
  ]);

  const [
    platformSessionStateAccount,
    sessionTreasuryState,
    sessionSignerListState,
    sessionParticipantListState,
  ] = await Promise.all([
    platformProgramClient.fetchPlatformSessionState(rpcClient.rpc, platformSessionState),
    platformPDA.getSessionTreasuryStatePDA(platformSessionState),
    platformPDA.getSessionSignerListStatePDA(platformSessionState),
    platformPDA.getSessionParticipantListStatePDA(platformSessionState)
  ]);

  const initiator = platformSessionStateAccount.data.initiatiorAddress;

  const resignInstruciton = await application.session.getResignInstruction({
    session: options.session,

    sessionTreasuryState,
    sessionSignerListState,
    sessionParticipantListState,

    platformSessionState,
    platformTokenTreasuryState,

    mint: options.mint,

    initiator,

    signer: options.signer,
  });

  const sessionParticipantListStateAccount =
    await platformProgramClient.fetchPubkeyList(rpcClient.rpc, sessionParticipantListState);

  const sessionParticipantList = sessionParticipantListStateAccount.data.pubkeys;

  const tokenProfileTreasuryStateList = await Promise.all(
    sessionParticipantList.map(participant =>
      platformPDA.getTokenProfileTreasuryStatePDA(
        participant,
        platformSessionStateAccount.data.interest.tokenPlugin,
      )
    )
  );

  tokenProfileTreasuryStateList.forEach(tokenProfileTreasuryState => {
    resignInstruciton.accounts.push({
      address: tokenProfileTreasuryState,
      role: kit.AccountRole.WRITABLE,
    });
  });

  await transaction.execute([options.signer], [resignInstruciton], commitment);
}
