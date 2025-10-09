import * as kit from "@solana/kit";

import * as solagramProgramClient from "../../../../../clients/js/src/generated/solagram";

import * as pda from "../pda";

import * as transaction from "../../../transaction";

export async function initializeProgram(wallet: kit.KeyPairSigner) {
  const globalState = await pda.getGlobalStatePDA();
  const communicationPluginListState = await pda.getCommunicationPluginListStatePDA();
  const tokenPluginListState = await pda.getTokenPluginListStatePDA();
  const applicationPluginListState = await pda.getApplicationPluginListStatePDA();

  const initializeGlobalStateInstruction = solagramProgramClient.getInitializeInstruction({
    admin: wallet,
    globalState,

    communicationPluginListState,
    tokenPluginListState,
    applicationPluginListState,
  });

  await transaction.executeTransaction([wallet], [initializeGlobalStateInstruction]);
}
