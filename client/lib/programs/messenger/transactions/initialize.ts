import * as kit from "@solana/kit";

import * as platformProgramClient from "../../../../../clients/js/src/generated/solagram";

import * as transaction from "../../../transaction";

import * as instructions from "../instructions";

interface InitializeInterface {
  admin: kit.KeyPairSigner,
};

export async function initialize(options: InitializeInterface) {
  const initializeInstruction = await instructions.initialize.getInitializeInstruction({
    platform: platformProgramClient.SOLAGRAM_PROGRAM_ADDRESS,

    admin: options.admin,
  });

  await transaction.executeTransaction([options.admin], [initializeInstruction]);
}
