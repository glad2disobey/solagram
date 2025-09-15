import * as kit from "@solana/kit";

import * as messengerProgramClient from "../../../../../clients/js/src/generated/messenger";

import * as pda from "../pda";
import * as transaction from "../../../transaction";

export async function initializePlugin(wallet: kit.KeyPairSigner, platformPDA: kit.Address) {
  const globalState = await pda.getGlobalStatePDA();

  const initializeGlobalStateInstruction = messengerProgramClient.getInitializeInstruction({
    admin: wallet,
    globalState,

    platform: platformPDA,
  });

  await transaction.executeTransaction(wallet, [initializeGlobalStateInstruction]);
}
