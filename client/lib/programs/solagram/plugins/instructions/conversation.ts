import * as kit from "@solana/kit";

import * as platformProgramClient from "../../../../../../clients/js/src/generated/solagram";

import * as pda from "../../pda";

interface GetRegisterConversationInstructionInterface {
  conversation: kit.Address,

  conversationPlugin: kit.Address,
  uniqueConversationNumber: bigint,

  owner: kit.KeyPairSigner,
};

export async function getRegisterConversationInstruction(
  options: GetRegisterConversationInstructionInterface
): Promise<platformProgramClient.RegisterConversationInstruction> {
  const [
    communicationPluginListState,
    platformConversationState,
    profileCommunicationListState,
  ] = await Promise.all([
    pda.getCommunicationPluginListStatePDA(),
    pda.getPlatformConversationStatePDA(options.conversation),
    pda.getProfileCommunicationListStatePDA(options.owner.address),
  ]);

  return platformProgramClient.getRegisterConversationInstruction({
    conversation: options.conversation,

    communicationPluginListState,
    platformConversationState,
    profileCommunicationListState,

    conversationPlugin: options.conversationPlugin,
    uniqueConversationNumber: options.uniqueConversationNumber,

    owner: options.owner,
  }) as platformProgramClient.RegisterConversationInstruction;
}

interface GetAddParticipantInstructionInterface {
  platformConversation: kit.Address,

  profile: kit.Address,

  signer: kit.KeyPairSigner,
};

export async function getAddParticipantInstruction(
  options: GetAddParticipantInstructionInterface,
): Promise<platformProgramClient.AddConversationParticipantInstruction> {
  const profileCommunicationListState = await pda.getProfileCommunicationListStatePDA(options.profile);

  return platformProgramClient.getAddConversationParticipantInstruction({
    platformConversation: options.platformConversation,

    platformConversationState: options.platformConversation,
    profileCommunicationListState,

    profile: options.profile,

    signer: options.signer,
  }) as platformProgramClient.AddConversationParticipantInstruction;
}
