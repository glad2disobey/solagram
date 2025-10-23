import * as kit from "@solana/kit";

import * as solagramProgramClient from "../../../../../../clients/js/src/generated/solagram";

import * as pda from "../../pda";

import * as connection from "../../../../connection";

const rpcClient = connection.getRpcClient();

interface GetRegisterConversationInstructionInterface {
  conversation: kit.Address,

  conversationPlugin: kit.Address,
  uniqueConversationNumber: bigint,

  owner: kit.KeyPairSigner,
};

export async function getRegisterConversationInstruction(
  options: GetRegisterConversationInstructionInterface
): Promise<solagramProgramClient.RegisterConversationInstruction> {
  const communicationPluginListState = await pda.getCommunicationPluginListStatePDA();
  const platformConversationState = await pda.getPlatformConversationStatePDA(options.conversation);
  const profileCommunicationListState = await pda.getProfileCommunicationListStatePDA(options.owner.address);

  return solagramProgramClient.getRegisterConversationInstruction({
    conversation: options.conversation,

    communicationPluginListState,
    platformConversationState,
    profileCommunicationListState,

    conversationPlugin: options.conversationPlugin,
    uniqueConversationNumber: options.uniqueConversationNumber,

    owner: options.owner,
  }) as solagramProgramClient.RegisterConversationInstruction;
}

interface GetAddParticipantInstructionInterface {
  platformConversation: kit.Address,

  profile: kit.Address,

  signer: kit.KeyPairSigner,
};

export async function getAddParticipantInstruction(
  options: GetAddParticipantInstructionInterface,
): Promise<solagramProgramClient.AddConversationParticipantInstruction> {
  const profileCommunicationListState = await pda.getProfileCommunicationListStatePDA(options.profile);
  return solagramProgramClient.getAddConversationParticipantInstruction({
    platformConversation: options.platformConversation,

    platformConversationState: options.platformConversation,
    profileCommunicationListState,

    profile: options.profile,

    signer: options.signer,
  }) as solagramProgramClient.AddConversationParticipantInstruction;
}
