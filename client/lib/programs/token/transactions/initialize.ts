import * as kit from "@solana/kit";

import * as instructions from "../instructions";

import * as transaction from "../../../transaction";

interface InitializeInterface {
  admin: kit.KeyPairSigner,
  mint: kit.KeyPairSigner,
};

export async function initialize(options: InitializeInterface) {
  const initializeInstruction = await instructions.initialize.getInitializeInstruction({
    admin: options.admin,
    mint: options.mint,
  });

  await transaction.executeTransaction([options.admin, options.mint], [initializeInstruction]);
}
