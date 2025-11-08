import * as kit from "@solana/kit";

import * as platformProgramClient from "../../../../../clients/js/src/generated/solagram";

import * as transaction from "../../../transaction";

import * as application from "../instructions";

interface InitializeInterface {
  admin: kit.KeyPairSigner,
};

export async function initialize(options: InitializeInterface, commitment: kit.Commitment = "confirmed") {
  const initializeInstruction = await application.initialize.getInitializeInstruction({
    platform: platformProgramClient.SOLAGRAM_PROGRAM_ADDRESS,

    admin: options.admin,
  });

  await transaction.execute([options.admin], [initializeInstruction], commitment);
}
