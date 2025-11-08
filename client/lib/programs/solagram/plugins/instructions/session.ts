import * as kit from "@solana/kit";

import * as platformProgramClient from "../../../../../../clients/js/src/generated/solagram";

import * as pda from "../../pda";

import * as connection from "../../../../connection";

const rpcClient = connection.getRpcClient();

interface GetRegisterPlatformSessionInstructionInterface {
  mint: kit.Address,

  sessionState: kit.Address,
  sessionCounter: bigint,

  participants: kit.Address[],

  applicationPlugin: kit.Address,
  tokenPlugin: kit.Address,
  share: bigint,

  transferFeeFlag: boolean,

  initiator: kit.KeyPairSigner,
}

export async function getRegisterPlatformSessionInstruction(
  options: GetRegisterPlatformSessionInstructionInterface,
): Promise<platformProgramClient.RegisterPlatformSessionInstruction> {
  const platformSessionState = await pda.getPlatformSessionStatePDA(options.sessionState);

  const [
    platformTokenState,
    applicationPluginListState,
    tokenPluginListState,
    sessionTreasuryState,
    sessionParticipantListState,
    sessionSignerListState,
  ] = await Promise.all([
    pda.getPlatformTokenStatePDA(options.tokenPlugin),
    pda.getApplicationPluginListStatePDA(),
    pda.getTokenPluginListStatePDA(),
    pda.getSessionTreasuryStatePDA(platformSessionState),
    pda.getSessionParticipantListStatePDA(platformSessionState),
    pda.getSessionSignerListStatePDA(platformSessionState),
  ]);

  return platformProgramClient.getRegisterPlatformSessionInstruction({
    platformSessionState,
    platformTokenState,

    applicationPluginListState,
    tokenPluginListState,

    sessionTreasuryState,
    sessionParticipantListState,
    sessionSignerListState,

    mint: options.mint,

    applicationPlugin: options.applicationPlugin,
    innerSession: options.sessionState,
    participants: options.participants,
    uniqueSessionNumber: options.sessionCounter,

    interest: {
      share: options.share,
      tokenPlugin: options.tokenPlugin,

      transferFeeFlag: options.transferFeeFlag,
    },

    signer: options.initiator,
  }) as platformProgramClient.RegisterPlatformSessionInstruction;
}

interface GetSignPlatformSessionInstructionInterface {
  mint: kit.Address,

  session: kit.Address,

  signer: kit.KeyPairSigner,
}

export async function getSignPlatformSessionInstruction(
  options: GetSignPlatformSessionInstructionInterface,
): Promise<platformProgramClient.SignPlatformSessionInstruction> {
  const platformSessionState = await pda.getPlatformSessionStatePDA(options.session);
  const platformSessionStateAccount =
    await platformProgramClient.fetchPlatformSessionState(rpcClient.rpc, platformSessionState);

  const tokenPluginAddress = platformSessionStateAccount.data.interest.tokenPlugin;

  const [
    sessionTreasuryState,
    sessionParticipantListState,
    sessionSignerListState,
    profileSessionListState,
    profilePendingSessionListState,
    tokenProfileTreasuryState,
  ] = await Promise.all([
    pda.getSessionTreasuryStatePDA(platformSessionState),
    pda.getSessionParticipantListStatePDA(platformSessionState),
    pda.getSessionSignerListStatePDA(platformSessionState),
    pda.getProfileSessionListStatePDA(options.signer.address),
    pda.getProfilePendingSessionListStatePDA(options.signer.address),
    pda.getTokenProfileTreasuryStatePDA(options.signer.address, tokenPluginAddress),
  ]);

  return platformProgramClient.getSignPlatformSessionInstruction({
    platformSessionState,

    sessionTreasuryState,
    sessionParticipantListState,
    sessionSignerListState,

    tokenProfileTreasuryState,

    profileSessionListState,
    profilePendingSessionListState,

    mint: options.mint,
    innerSession: options.session,

    signer: options.signer,
  }) as platformProgramClient.SignPlatformSessionInstruction;
}

interface GetInvitePlatformSessionInstructionInterface {
  session: kit.Address,
  participant: kit.Address,

  signer: kit.KeyPairSigner,
}

export async function getInvitePlatformSessionInstruction(
  options: GetInvitePlatformSessionInstructionInterface,
): Promise<platformProgramClient.InvitePlatformSessionInstruction> {
  const platformSessionState = await pda.getPlatformSessionStatePDA(options.session);

  const [
    sessionSignerListState,
    sessionParticipantListState,
    profileSessionListState,
    profilePendingSessionListState,
  ] = await Promise.all([
    pda.getSessionSignerListStatePDA(platformSessionState),
    pda.getSessionParticipantListStatePDA(platformSessionState),
    pda.getProfileSessionListStatePDA(options.participant),
    pda.getProfilePendingSessionListStatePDA(options.participant),
  ]);

  return platformProgramClient.getInvitePlatformSessionInstruction({
    platformSessionState,

    sessionSignerListState,
    sessionParticipantListState,

    profileSessionListState,
    profilePendingSessionListState,

    innerSession: options.session,
    participant: options.participant,

    signer: options.signer,
  }) as platformProgramClient.InvitePlatformSessionInstruction;
}

interface GetAbortPlatformSessionInstructionInterface {
  session: kit.Address,

  tokenPlugin: kit.Address,
  mint: kit.Address,

  signer: kit.KeyPairSigner,
}

export async function getAbortPlatformSessionInstruction(
  options: GetAbortPlatformSessionInstructionInterface,
): Promise<platformProgramClient.AbortPlatformSessionInstruction> {
  const platformSessionState = await pda.getPlatformSessionStatePDA(options.session);

  const [
    platformTokenTreasuryState,
    sessionTreasuryState,
    sessionSignerListState,
    sessionParticipantListState,
    profilePendingSessionListState,
    platformSessionStateAccount,
  ] = await Promise.all([
    pda.getPlatformTokenTreasuryStatePDA(options.tokenPlugin),
    pda.getSessionTreasuryStatePDA(platformSessionState),
    pda.getSessionSignerListStatePDA(platformSessionState),
    pda.getSessionParticipantListStatePDA(platformSessionState),
    pda.getProfilePendingSessionListStatePDA(options.signer.address),
    platformProgramClient.fetchPlatformSessionState(rpcClient.rpc, platformSessionState),
  ]);

  return platformProgramClient.getAbortPlatformSessionInstruction({
    innerSession: options.session,
    
    platformSessionState,
    platformTokenTreasuryState,

    sessionTreasuryState,
    sessionSignerListState,
    sessionParticipantListState,

    profilePendingSessionListState,

    mint: options.mint,
    initiator: platformSessionStateAccount.data.initiatiorAddress,

    signer: options.signer,
  }) as platformProgramClient.AbortPlatformSessionInstruction;
}

interface GetPurgeProfileSessionsInstructionInterface {
  sessionList: kit.Address[],
  pendingSessionList: kit.Address[],

  signer: kit.KeyPairSigner,
}

export async function getPurgeProfileSessionsInstruction(
  options: GetPurgeProfileSessionsInstructionInterface,
): Promise<platformProgramClient.PurgeProfileSessionsInstruction> {
  const [
    profileSessionListState,
    profilePendingSessionListState,
  ] = await Promise.all([
    pda.getProfileSessionListStatePDA(options.signer.address),
    pda.getProfilePendingSessionListStatePDA(options.signer.address),
  ]);

  return platformProgramClient.getPurgeProfileSessionsInstruction({
    profileSessionListState,
    profilePendingSessionListState,

    sessionList: options.sessionList,
    pendingSessionList: options.pendingSessionList,

    signer: options.signer,
  }) as platformProgramClient.PurgeProfileSessionsInstruction;
}
