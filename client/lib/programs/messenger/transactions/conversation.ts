import * as kit from "@solana/kit";

import * as messengerProgramClient from "../../../../../clients/js/src/generated/messenger";
import * as platformProgramClient from "../../../../../clients/js/src/generated/solagram";

import * as pda from "../pda";
import * as platformPDA from "../../solagram/pda";

import * as connection from "../../../connection";
import * as transaction from "../../../transaction";

import * as instructions from "../instructions";
import * as pluginInstructions from "../../solagram/plugins/instructions";

const rpcClient = connection.getRpcClient();

interface OpenConversationInterface {
  title: string,

  owner: kit.KeyPairSigner,
};

export async function openConversation(options: OpenConversationInterface) {
  const openConversationInstruction = await instructions.conversation.getOpenConversationInstruction({
    title: options.title,

    owner: options.owner,
  });

  const globalState = await pda.getGlobalStatePDA();
  const globalStateAccount = await messengerProgramClient.fetchGlobalState(rpcClient.rpc, globalState);

  const conversation = await pda.getConversationStatePDA(globalStateAccount.data.conversationCounter);

  const registerConversationInstruction = await pluginInstructions.conversation.getRegisterConversationInstruction({
    conversationPlugin: messengerProgramClient.MESSENGER_PROGRAM_ADDRESS,

    conversation,
    uniqueConversationNumber: globalStateAccount.data.conversationCounter,

    owner: options.owner,
  });

  await transaction.executeTransaction([options.owner], [openConversationInstruction, registerConversationInstruction]);
}

interface AddParticipantInterface {
  platformConversationState: kit.Address,

  participant: kit.Address,

  signer: kit.KeyPairSigner,
};

export async function addParticipant(options: AddParticipantInterface) {
  const platformConversationStateAccount =
    await platformProgramClient.fetchPlatformConversationState(rpcClient.rpc, options.platformConversationState);

  const conversationState = platformConversationStateAccount.data.conversation;

  const profileCommunicationListState = await platformPDA.getProfileCommunicationListStatePDA(options.participant);

  const addParticipantInstruction = await instructions.conversation.getAddParticipantInstruction({
    conversationState: conversationState,
    platformConversationState: options.platformConversationState,
    profileCommunicationListState: profileCommunicationListState,

    participant: options.participant,

    signer: options.signer,
  });

  await transaction.executeTransaction([options.signer], [addParticipantInstruction]);
}
