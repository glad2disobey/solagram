import * as kit from "@solana/kit";

import * as applicationProgramClient from "../../../../../clients/js/src/generated/application";

import * as pda from "../pda";

import * as connection from "../../../connection";

const rpcClient = connection.getRpcClient();

interface GetStartSessionInstructionInterface {
  initiator: kit.KeyPairSigner,
}

export async function getStartSessionInstruction(
  options: GetStartSessionInstructionInterface,
): Promise<applicationProgramClient.StartSessionInstruction> {
  const globalState = await pda.getGlobalStatePDA();
  const globalStateAccount = await applicationProgramClient.fetchGlobalState(rpcClient.rpc, globalState);

  const sessionState = await pda.getSessionStatePDA(globalStateAccount.data.sessionCounter);

  return applicationProgramClient.getStartSessionInstruction({
    globalState,
    sessionState,

    signer: options.initiator,
  }) as applicationProgramClient.StartSessionInstruction;
}

interface GetMakeMoveInstructionInterface {
  platformSessionState: kit.Address,
  platformTokenTreasuryState: kit.Address,

  sessionTreasuryState: kit.Address,
  sessionSignerListState: kit.Address,
  sessionParticipantListState: kit.Address,

  session: kit.Address,

  initiator: kit.Address,
  mint: kit.Address,

  x: number,
  y: number,

  signer: kit.KeyPairSigner,
}

export async function getMakeMoveInstruction(
  options: GetMakeMoveInstructionInterface,
): Promise<applicationProgramClient.MakeMoveInstruction> {
  const [globalState, pdaSigner] = await Promise.all([
    pda.getGlobalStatePDA(),
    pda.getSignerPDA(),
  ]);

  return applicationProgramClient.getMakeMoveInstruction({
    globalState,

    platformSessionState: options.platformSessionState,
    platformTokenTreasuryState: options.platformTokenTreasuryState,

    sessionState: options.session,
    sessionTreasuryState: options.sessionTreasuryState,
    sessionSignerListState: options.sessionSignerListState,
    sessionParticipantListState: options.sessionParticipantListState,

    session: options.session,

    initiator: options.initiator,
    mint: options.mint,

    x: options.x,
    y: options.y,

    pdaSigner,

    signer: options.signer,
  }) as applicationProgramClient.MakeMoveInstruction;
}

interface GetResignInstructionInterface {
  platformSessionState: kit.Address,
  platformTokenTreasuryState: kit.Address,

  sessionTreasuryState: kit.Address,
  sessionSignerListState: kit.Address,
  sessionParticipantListState: kit.Address,

  session: kit.Address,

  initiator: kit.Address,
  mint: kit.Address,

  signer: kit.KeyPairSigner,
}

export async function getResignInstruction(
  options: GetResignInstructionInterface,
): Promise<applicationProgramClient.ResignInstruction> {
  const [globalState, pdaSigner] = await Promise.all([
    pda.getGlobalStatePDA(),
    pda.getSignerPDA(),
  ]);

  return applicationProgramClient.getResignInstruction({
    globalState,

    platformSessionState: options.platformSessionState,
    platformTokenTreasuryState: options.platformTokenTreasuryState,

    sessionState: options.session,
    sessionTreasuryState: options.sessionTreasuryState,
    sessionSignerListState: options.sessionSignerListState,
    sessionParticipantListState: options.sessionParticipantListState,

    session: options.session,

    initiator: options.initiator,
    mint: options.mint,

    pdaSigner,

    signer: options.signer,
  }) as applicationProgramClient.MakeMoveInstruction;
}
