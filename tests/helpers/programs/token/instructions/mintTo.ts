import * as kit from "@solana/kit";
import * as token from "@solana-program/token-2022";

import * as transaction from "../../../transaction";

interface MintToInterface {
  mint: kit.Address,
  authority: kit.KeyPairSigner,
  destination: kit.Address,
  amount: bigint,
}

export async function mintTo(options: MintToInterface) {
  const mintToInstruction = token.getMintToInstruction({
    mint: options.mint,
    mintAuthority: options.authority,
    token: options.destination,
    amount: options.amount,
  });

  await transaction.executeTransaction([options.authority], [mintToInstruction]);
}
