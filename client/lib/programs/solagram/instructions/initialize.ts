import * as kit from "@solana/kit";

import * as platformProgramClient from "../../../../../clients/js/src/generated/solagram";

import * as pda from "../pda";

interface GetInitializeInstructionInterface {
  admin: kit.KeyPairSigner,
}

export async function getInitializeInstruction(
  options: GetInitializeInstructionInterface,
): Promise<platformProgramClient.InitializeInstruction> {
  const globalState = await pda.getGlobalStatePDA();
  const communicationPluginListState = await pda.getCommunicationPluginListStatePDA();
  const tokenPluginListState = await pda.getTokenPluginListStatePDA();
  const applicationPluginListState = await pda.getApplicationPluginListStatePDA();

  return platformProgramClient.getInitializeInstruction({
    globalState,
    communicationPluginListState,
    tokenPluginListState,
    applicationPluginListState,

    admin: options.admin,
  }) as platformProgramClient.InitializeInstruction;
}
