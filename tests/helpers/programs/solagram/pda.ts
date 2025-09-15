import * as kit from "@solana/kit";

import * as solagramProgramClient from "../../../../clients/js/src/generated/solagram";

import * as factories from "../../factories";

import * as constants from "./constants";
import * as plugins from "./plugins";

const getPDA = factories.getPDAFactory(solagramProgramClient.SOLAGRAM_PROGRAM_ADDRESS);

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
