import * as kit from "@solana/kit";

import * as applicationProgramClient from "../../../../clients/js/src/generated/application";

import * as factory from "../../factory";

import * as constants from "./constants";

import * as solagram from "../solagram";

const getPDA = factory.getPDAFactory(applicationProgramClient.APPLICATION_PROGRAM_ADDRESS);

let globalStatePDA: kit.Address;
export const getGlobalStatePDA = async (): Promise<kit.Address> => globalStatePDA
  || (globalStatePDA = await getPDA([constants.GLOBAL_STATE_SEED_KEY]));
  
let signerPDA: kit.Address;
export const getSignerPDA = async (): Promise<kit.Address> => signerPDA
  || (signerPDA = await getPDA([solagram.plugins.constants.SIGNER_SEED_KEY]));

export const getSessionStatePDA = async (sessionNumber: BigInt): Promise<kit.Address> =>
  getPDA([solagram.plugins.constants.SESSION_STATE_SEED_KEY, sessionNumber]);
