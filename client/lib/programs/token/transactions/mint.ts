import * as kit from "@solana/kit";

import * as instructions from "../instructions";

import * as transaction from "../../../transaction";

interface MintToInterface {
  mint: kit.Address,

  destination: kit.Address,
  amount: bigint,

  authority: kit.KeyPairSigner,
};

export async function mintTo(options: MintToInterface) {
  const mintToInstruction = await instructions.mint.getMintToInstruction(options);

  await transaction.executeTransaction([options.authority], [mintToInstruction]);
}
