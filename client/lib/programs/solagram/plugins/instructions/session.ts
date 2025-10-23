import * as kit from "@solana/kit";

import * as solagramProgramClient from "../../../../../../clients/js/src/generated/solagram";

import * as pda from "../../pda";

import * as connection from "../../../../connection";

const rpcClient = connection.getRpcClient();

interface GetStartPlatformSessionInstructionInterface {
  mint: kit.Address,

  sessionState: kit.Address,
  sessionCounter: bigint,

  participants: kit.Address[],

  applicationPlugin: kit.Address,
  tokenPlugin: kit.Address,
  share: bigint,

  initiator: kit.KeyPairSigner,
}

export async function getStartPlatformSessionInstruction(
  options: GetStartPlatformSessionInstructionInterface,
): Promise<solagramProgramClient.RegisterPlatformSessionInstruction> {
  const platformSessionState = await pda.getPlatformSessionStatePDA(options.sessionState);
  const platformTokenState = await pda.getPlatformTokenStatePDA(options.tokenPlugin);

  const applicationPluginListState = await pda.getApplicationPluginListStatePDA();
  const tokenPluginListState = await pda.getTokenPluginListStatePDA();

  const sessionTreasuryState = await pda.getSessionTreasuryStatePDA(platformSessionState);
  const sessionParticipantListState = await pda.getSessionParticipantListStatePDA(platformSessionState);
  const sessionSignerListState = await pda.getSessionSignerListStatePDA(platformSessionState);

  return solagramProgramClient.getRegisterPlatformSessionInstruction({
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
    },

    signer: options.initiator,
  }) as solagramProgramClient.RegisterPlatformSessionInstruction;
}

interface GetSignPlatformSessionInstructionInterface {
  mint: kit.Address,

  sessionStateAddress: kit.Address,

  signer: kit.KeyPairSigner,
}

export async function getSignPlatformSessionInstruction(
  options: GetSignPlatformSessionInstructionInterface,
): Promise<solagramProgramClient.SignPlatformSessionInstruction> {
  const platformSessionState = await pda.getPlatformSessionStatePDA(options.sessionStateAddress);

  const platformSessionStateAccount =
    await solagramProgramClient.fetchPlatformSessionState(rpcClient.rpc, platformSessionState);

  const tokenPluginAddress = platformSessionStateAccount.data.interest.tokenPlugin;

  const sessionTreasuryState = await pda.getSessionTreasuryStatePDA(platformSessionState);
  const sessionParticipantListState = await pda.getSessionParticipantListStatePDA(platformSessionState);
  const sessionSignerListState = await pda.getSessionSignerListStatePDA(platformSessionState);

  const tokenProfileTreasuryState =
    await pda.getTokenProfileTreasuryStatePDA(options.signer.address, tokenPluginAddress);

  return solagramProgramClient.getSignPlatformSessionInstruction({
    platformSessionState,
    sessionTreasuryState,
    sessionParticipantListState,
    sessionSignerListState,
    tokenProfileTreasuryState,

    mint: options.mint,
    innerSession: options.sessionStateAddress,

    signer: options.signer,
  }) as solagramProgramClient.SignPlatformSessionInstruction;
}
