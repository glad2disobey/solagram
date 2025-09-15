import * as kit from "@solana/kit";

import * as messengerProgramClient from "../../../../clients/js/src/generated/messenger";

import * as factories from "../../factories";

import * as constants from "./constants";

import * as solagram from "../solagram";

const getPDA = factories.getPDAFactory(messengerProgramClient.MESSENGER_PROGRAM_ADDRESS);

let globalStatePDA: kit.Address;
export const getGlobalStatePDA = async (): Promise<kit.Address> => globalStatePDA
  || (globalStatePDA = await getPDA([constants.GLOBAL_STATE_SEED_KEY]));

export const getConversationStatePDA = async (conversationNumber: BigInt): Promise<kit.Address> =>
  getPDA([solagram.plugins.constants.CONVERSATION_STATE_SEED_KEY, conversationNumber]);

export const getMessageStatePDA = async (messageNumber: BigInt): Promise<kit.Address> =>
  getPDA([constants.MESSAGE_STATE_SEED_KEY, messageNumber]);
