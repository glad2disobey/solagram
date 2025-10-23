import * as kit from "@solana/kit";

import * as platformProgramClient from "../../../../../clients/js/src/generated/solagram";

import * as connection from "../../../connection";
import * as transaction from "../../../transaction";

import * as application from "../instructions";

const rpcClient = connection.getRpcClient();

interface InitializeInterface {
  admin: kit.KeyPairSigner,
};

export async function initialize(options: InitializeInterface) {
  const initializeInstruction = await application.initialize.getInitializeInstruction({
    platform: platformProgramClient.SOLAGRAM_PROGRAM_ADDRESS,

    admin: options.admin,
  });

  await transaction.executeTransaction([options.admin], [initializeInstruction]);
}
