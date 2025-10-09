import * as kit from "@solana/kit";

import * as tokenProgramClient from "../../../../../clients/js/src/generated/token";

import * as transaction from "../../../transaction";
import * as pda from "../pda";

export async function initializePlugin(wallet: kit.KeyPairSigner, mintAccount: kit.KeyPairSigner) {
  const globalStatePDA = await pda.getGlobalStatePDA();

  const initializeGlobalStateInstruction = tokenProgramClient.getInitializeInstruction({
    admin: wallet,

    globalState: globalStatePDA,

    mintAccount,
  });

  await transaction.executeTransaction([wallet, mintAccount], [initializeGlobalStateInstruction]);
}
