import * as kit from "@solana/kit";

import * as solagramProgramClient from "../../../../../clients/js/src/generated/solagram";
import * as messengerProgramClient from "../../../../../clients/js/src/generated/messenger";

import * as pda from "../pda";
import * as solagramPDA from "../../solagram/pda";

import * as connection from "../../../connection";
import * as transaction from "../../../transaction";

const rpcClient = connection.getRpcClient();

export async function addMessage(
  participant: kit.KeyPairSigner,

  platformConversationState: kit.Address,

  messageText: string,
) {
  const globalState = await pda.getGlobalStatePDA();
  const globaLStateAccount = await messengerProgramClient.fetchGlobalState(rpcClient.rpc, globalState);

  const platformProfileCommunicationListState = await solagramPDA.getProfileCommunicationListStatePDA(participant.address);

  const platformConversationStateAccount = await solagramProgramClient.fetchPlatformConversationState(
    rpcClient.rpc,
    
    platformConversationState,
  );

  const conversationState = platformConversationStateAccount.data.conversation;

  const messageState = await pda.getMessageStatePDA(globaLStateAccount.data.messageCounter);

  const addMessageInstruction = messengerProgramClient.getAddMessageInstruction({
    globalState,

    platformConversationState,
    platformProfileCommunicationListState,

    conversationState,
    messageState,

    platformConversation: platformConversationState,
    messageText,

    participant,
  });

  await transaction.executeTransaction(participant, [addMessageInstruction]);
}
