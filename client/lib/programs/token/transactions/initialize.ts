import * as kit from "@solana/kit";

import * as instructions from "../instructions";

import * as transaction from "../../../transaction";

interface InitializeInterface {
  admin: kit.KeyPairSigner,
  mint: kit.KeyPairSigner,
};

export async function initialize(options: InitializeInterface, commitment: kit.Commitment = "confirmed") {
  const initializeInstruction = await instructions.initialize.getInitializeInstruction({
    admin: options.admin,
    mint: options.mint,
  });

  await transaction.execute([options.admin, options.mint], [initializeInstruction], commitment);
}
