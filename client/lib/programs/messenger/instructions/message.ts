import * as kit from "@solana/kit";

import * as messengerProgramClient from "../../../../../clients/js/src/generated/messenger";

import * as pda from "../pda";

import * as connection from "../../../connection";

const rpcClient = connection.getRpcClient();

interface GetAddMessageInstructionInterface {
  conversationState: kit.Address,
  platformConversationState: kit.Address,
  platformProfileCommunicationListState: kit.Address,

  message: string,

  participant: kit.KeyPairSigner,
}

export async function getAddMessageInstruction(
  opitons: GetAddMessageInstructionInterface,
): Promise<messengerProgramClient.AddMessageInstruction> {
  const globalState = await pda.getGlobalStatePDA();
  const globalStateAccount = await messengerProgramClient.fetchGlobalState(rpcClient.rpc, globalState);

  const messageState = await pda.getMessageStatePDA(globalStateAccount.data.messageCounter);

  return messengerProgramClient.getAddMessageInstruction({
    globalState,
    messageState,

    conversationState: opitons.conversationState,
    platformProfileCommunicationListState: opitons.platformProfileCommunicationListState,
    platformConversationState: opitons.platformConversationState,

    platformConversation: opitons.platformConversationState,

    messageText: opitons.message,

    participant: opitons.participant,
  }) as messengerProgramClient.AddMessageInstruction;
}
