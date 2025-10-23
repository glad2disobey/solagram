import * as kit from "@solana/kit";

import * as applicationProgramClient from "../../../../../clients/js/src/generated/application";

import * as pda from "../pda";

import * as connection from "../../../connection";
import * as transaction from "../../../transaction";

import * as application from "../instructions";
import * as pluginInstructions from "../../solagram/plugins/instructions";

const rpcClient = connection.getRpcClient();

interface StartSessionInterface {
  tokenPlugin: kit.Address,
  mint: kit.Address,
  share: bigint,

  participants: kit.Address[],

  initiator: kit.KeyPairSigner,
};

export async function startSession(options: StartSessionInterface) {
  const startSessionInstruction = await application.session.getStartSessionInstruction({
    initiator: options.initiator,
  });

  const globalState = await pda.getGlobalStatePDA();
  const globalStateAccount = await applicationProgramClient.fetchGlobalState(rpcClient.rpc, globalState);

  const sessionCounter = globalStateAccount.data.sessionCounter;

  const sessionState = await pda.getSessionStatePDA(sessionCounter);

  const startPlatformSessionInstruction = await pluginInstructions.session.getStartPlatformSessionInstruction({
    applicationPlugin: applicationProgramClient.APPLICATION_PROGRAM_ADDRESS,
    sessionState,

    tokenPlugin: options.tokenPlugin,
    mint: options.mint,
    share: options.share,

    participants: options.participants,
    sessionCounter,

    initiator: options.initiator,
  });

  await transaction.executeTransaction([options.initiator], [
    startSessionInstruction,
    startPlatformSessionInstruction,
  ]);
}
