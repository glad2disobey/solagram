import * as kit from "@solana/kit";

import * as solagramProgramClient from "../../../../clients/js/src/generated/solagram";

import * as factory from "../../factory";

import * as constants from "./constants";
import * as plugins from "./plugins";

const getPDA = factory.getPDAFactory(solagramProgramClient.SOLAGRAM_PROGRAM_ADDRESS);

let globalStatePDA: kit.Address;
export const getGlobalStatePDA = async (): Promise<kit.Address> => globalStatePDA
  || (globalStatePDA = await getPDA([constants.GLOBAL_STATE_SEED_KEY]));

let communicationPluginListStatePDA: kit.Address;
export const getCommunicationPluginListStatePDA = async (): Promise<kit.Address> => communicationPluginListStatePDA
  || (communicationPluginListStatePDA = await getPDA([plugins.constants.COMMUNICATION_PLUGIN_LIST_STATE_SEED_KEY]));

let tokenPluginListStatePDA: kit.Address;
export const getTokenPluginListStatePDA = async (): Promise<kit.Address> => tokenPluginListStatePDA
  || (tokenPluginListStatePDA = await getPDA([plugins.constants.TOKEN_PLUGIN_LIST_STATE_SEED_KEY]));

let applicationPluginListStatePDA: kit.Address;
export const getApplicationPluginListStatePDA = async (): Promise<kit.Address> => applicationPluginListStatePDA
  || (applicationPluginListStatePDA = await getPDA([plugins.constants.APPLICATION_PLUGIN_LIST_STATE_SEED_KEY]));

export const getPluginStatePDA = async (pluginType: plugins.types.PluginType): Promise<kit.Address> =>
  getPDA([plugins.types.getPluginListSeedKey(pluginType)]);

export const getProfileStatePDA = async (profileAddress: kit.Address): Promise<kit.Address> =>
  getPDA([constants.PROFILE_STATE_SEED_KEY, profileAddress]);

export const getProfileCommunicationListStatePDA = async (profileAddress: kit.Address): Promise<kit.Address> =>
  getPDA([constants.PROFILE_COMMUNICATION_LIST_STATE_SEED_KEY, profileAddress]);

export const getPlatformConversationStatePDA = async (conversationStatePDA: kit.Address): Promise<kit.Address> =>
  getPDA([plugins.constants.PLATFORM_CONVERSATION_STATE_SEED_KEY, conversationStatePDA]);

export const getPlatformTokenStatePDA = async (pluginAddress: kit.Address): Promise<kit.Address> =>
  getPDA([plugins.constants.PLATFORM_TOKEN_STATE_SEED_KEY, pluginAddress]);

export const getPlatformTokenTreasuryStatePDA = async (pluginAddress: kit.Address): Promise<kit.Address> =>
  getPDA([plugins.constants.PLATFORM_TOKEN_TREASURY_STATE_SEED_KEY, pluginAddress]);

export const getTokenProfileTreasuryStatePDA =
  async (profileAddress: kit.Address, tokenAddress: kit.Address): Promise<kit.Address> =>
    getPDA([plugins.constants.TOKEN_PROFILE_TREASURY_STATE_SEED_KEY, tokenAddress, profileAddress]);

export const getPlatformSessionStatePDA = async (sessionAddress: kit.Address): Promise<kit.Address> =>
  getPDA([plugins.constants.PLATFORM_SESSION_STATE_SEED_KEY, sessionAddress]);

export const getSessionTreasuryStatePDA = async (sessionAddress: kit.Address): Promise<kit.Address> =>
  getPDA([plugins.constants.SESSION_TREASURY_STATE_SEED_KEY, sessionAddress]);

export const getSessionParticipantListStatePDA = async (sessionAddress: kit.Address): Promise<kit.Address> =>
  getPDA([plugins.constants.SESSION_PARTICIPANT_LIST_STATE_SEED_KEY, sessionAddress]);

export const getSessionSignerListStatePDA = async (sessionAddress: kit.Address): Promise<kit.Address> =>
  getPDA([plugins.constants.SESSION_SIGNER_LIST_STATE_SEED_KEY, sessionAddress]);

