import * as kit from "@solana/kit";

import * as messengerProgramClient from "../../../../../clients/js/src/generated/messenger";

import * as pda from "../pda";

import * as connection from "../../../connection";

const rpcClient = connection.getRpcClient();

interface GetOpenConversationInstructionInterface {
  title: string,

  owner: kit.KeyPairSigner,
};

export async function getOpenConversationInstruction(
  options: GetOpenConversationInstructionInterface,
): Promise<messengerProgramClient.OpenConversationInstruction> {
  const globalState = await pda.getGlobalStatePDA();
  const globalStateAccount = await messengerProgramClient.fetchGlobalState(rpcClient.rpc, globalState);

  const conversationState = await pda.getConversationStatePDA(globalStateAccount.data.conversationCounter);

  return messengerProgramClient.getOpenConversationInstruction({
    globalState,
    conversationState,

    title: options.title,

    owner: options.owner,
  }) as messengerProgramClient.OpenConversationInstruction;
}

interface GetAddParticipantInstructionInterface {
  participant: kit.Address,

  conversationState: kit.Address,
  platformConversationState: kit.Address,

  profileCommunicationListState: kit.Address,

  signer: kit.KeyPairSigner,
};

export async function getAddParticipantInstruction(
  options: GetAddParticipantInstructionInterface,
): Promise<messengerProgramClient.AddParticipantInstruction> {
  const globalState = await pda.getGlobalStatePDA();

  return messengerProgramClient.getAddParticipantInstruction({
    globalState,
    platformConversation: options.platformConversationState,
    platformConversationState: options.platformConversationState,
    conversationState: options.conversationState,
    platformProfileCommunicationListState: options.profileCommunicationListState,

    participant: options.participant,

    signer: options.signer,
  }) as messengerProgramClient.AddParticipantInstruction;
}
