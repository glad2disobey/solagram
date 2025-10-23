import * as kit from "@solana/kit";

import * as platformProgramClient from "../../../../../clients/js/src/generated/solagram";

import * as platformPDA from "../../solagram/pda";

import * as connection from "../../../connection";
import * as transaction from "../../../transaction";

import * as instructions from "../instructions";

const rpcClient = connection.getRpcClient();

interface AddMessageInterface {
  platformConversationState: kit.Address,

  message: string,

  participant: kit.KeyPairSigner,
};

export async function addMessage(options: AddMessageInterface) {
  const platformConversationStateAccount =
    await platformProgramClient.fetchPlatformConversationState(rpcClient.rpc, options.platformConversationState);

  const platformProfileCommunicationListState =
    await platformPDA.getProfileCommunicationListStatePDA(options.participant.address);

  const addMessageInstruction = await instructions.message.getAddMessageInstruction({
    platformProfileCommunicationListState,
    platformConversationState: options.platformConversationState,
    conversationState: platformConversationStateAccount.data.conversation,

    message: options.message,

    participant: options.participant,
  });

  await transaction.executeTransaction([options.participant], [addMessageInstruction]);
}
