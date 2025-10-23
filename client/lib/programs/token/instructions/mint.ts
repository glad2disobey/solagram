import * as kit from "@solana/kit";

import * as token from "@solana-program/token-2022";

interface MintToInterface {
  mint: kit.Address,

  destination: kit.Address,
  amount: bigint,

  authority: kit.KeyPairSigner,
}

export async function getMintToInstruction(
  options: MintToInterface,
): Promise<token.MintToInstruction> {
  return token.getMintToInstruction({
    mint: options.mint,

    token: options.destination,
    amount: options.amount,

    mintAuthority: options.authority,
  }) as token.MintToInstruction;
}
