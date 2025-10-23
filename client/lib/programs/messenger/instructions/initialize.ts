import * as kit from "@solana/kit";

import * as messengerProgramClient from "../../../../../clients/js/src/generated/messenger";

import * as pda from "../pda";

interface GetInitializeInstructionInterface {
  platform: kit.Address,

  admin: kit.KeyPairSigner,
};

export async function getInitializeInstruction(
  options: GetInitializeInstructionInterface,
): Promise<messengerProgramClient.InitializeInstruction> {
  const globalState = await pda.getGlobalStatePDA();

  return messengerProgramClient.getInitializeInstruction({
    globalState,

    platform: options.platform,

    admin: options.admin,
  }) as messengerProgramClient.InitializeInstruction;
}
