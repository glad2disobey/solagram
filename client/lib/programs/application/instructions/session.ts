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
