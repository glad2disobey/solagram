import * as kit from "@solana/kit";

import * as tokenProgramClient from "../../../../clients/js/src/generated/token";

import * as factory from "../../factory";

import * as constants from "./constants";

const getPDA = factory.getPDAFactory(tokenProgramClient.TOKEN_PROGRAM_ADDRESS);

let globalStatePDA: kit.Address;
export const getGlobalStatePDA = async (): Promise<kit.Address> => globalStatePDA
  || (globalStatePDA = await getPDA([constants.GLOBAL_STATE_SEED_KEY]));
