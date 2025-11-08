import * as kit from "@solana/kit";

import * as tokenProgramClient from "../../../../../clients/js/src/generated/token";

import * as pda from "../pda";

interface GetInitializeInstructionInterface {
  admin: kit.KeyPairSigner,
  mint: kit.KeyPairSigner,
}

export async function getInitializeInstruction(
  options: GetInitializeInstructionInterface,
): Promise<tokenProgramClient.InitializeInstruction> {
  const globalState = await pda.getGlobalStatePDA();

  return tokenProgramClient.getInitializeInstruction({
    globalState,

    admin: options.admin,
    mint: options.mint,
  }) as tokenProgramClient.InitializeInstruction;
}
