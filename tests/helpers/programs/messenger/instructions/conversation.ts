import * as kit from "@solana/kit";

import * as solagramProgramClient from "../../../../../clients/js/src/generated/solagram";
import * as messengerProgramClient from "../../../../../clients/js/src/generated/messenger";

import * as pda from "../pda";
import * as solagramPDA from "../../solagram/pda";

import * as connection from "../../../connection";
import * as transaction from "../../../transaction";

const rpcClient = connection.getRpcClient();

export async function openConversation(owner: kit.KeyPairSigner, title: string) {
  const globalState = await pda.getGlobalStatePDA();
  const globalStateAccount = await messengerProgramClient.fetchGlobalState(rpcClient.rpc, globalState);

  const conversationState = await pda.getConversationStatePDA(globalStateAccount.data.conversationCounter);

  const communicationPluginListState = await solagramPDA.getCommunicationPluginListStatePDA();
  const platformConversationState = await solagramPDA.getPlatformConversationStatePDA(conversationState);
  const profileCommunicationListState = await solagramPDA.getProfileCommunicationListStatePDA(owner.address);

  const openConversationInstruction = messengerProgramClient.getOpenConversationInstruction({
    globalState,
    conversationState,

    title,

    owner,
  });

  const registerConversation = solagramProgramClient.getRegisterConversationInstruction({
    profileCommunicationListState,
    platformConversationState,
    communicationPluginListState,

    conversation: conversationState,
    conversationPlugin: messengerProgramClient.MESSENGER_PROGRAM_ADDRESS,
    uniqueConversationNumber: globalStateAccount.data.conversationCounter,

    owner,
  });

  await transaction.executeTransaction([owner], [openConversationInstruction, registerConversation]);
}

export async function addParticipant(
  signer: kit.KeyPairSigner,
  participant: kit.Address,

  platformConversationState: kit.Address,
) {
  const globalState = await pda.getGlobalStatePDA();

  const platformProfileCommunicationListState = await solagramPDA.getProfileCommunicationListStatePDA(participant);

  const platformConversationStateAccount = await solagramProgramClient.fetchPlatformConversationState(
    rpcClient.rpc,

    platformConversationState,
  );

  const conversationState = platformConversationStateAccount.data.conversation;

  const addParticipantInstruction = messengerProgramClient.getAddParticipantInstruction({
    globalState,

    platformConversationState,
    platformProfileCommunicationListState,

    conversationState,

    platformConversation: platformConversationState,
    participant: participant,

    signer,
  });

  await transaction.executeTransaction([signer], [addParticipantInstruction]);
}
