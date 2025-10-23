import * as kit from "@solana/kit";

import * as applicationProgramClient from "../../../../../clients/js/src/generated/application";

import * as pda from "../pda";

interface GetInitializeInstructionInterface {
  platform: kit.Address,

  admin: kit.KeyPairSigner,
};

export async function getInitializeInstruction(
  options: GetInitializeInstructionInterface,
): Promise<applicationProgramClient.InitializeInstruction> {
  const globalState = await pda.getGlobalStatePDA();

  return applicationProgramClient.getInitializeInstruction({
    globalState,

    platform: options.platform,

    admin: options.admin,
  }) as applicationProgramClient.InitializeInstruction;
}
