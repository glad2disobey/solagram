import * as kit from "@solana/kit";

import * as instructions from "../instructions";

import * as transaction from "../../../transaction";

interface CreateProfileInterface {
  name: string,

  wallet: kit.KeyPairSigner,
}

export async function createProfile(
  options: CreateProfileInterface,
  commitment: kit.Commitment = "confirmed",
) {
  const [
    createProfileInstruction,
    createTokenAccountInstructions,
  ] = await Promise.all([
    instructions.profile.getCreateProfileInstruction({
      name: options.name,
  
      wallet: options.wallet,
    }),
    instructions.profile.getCreateTokenAccountInstructions({
      wallet: options.wallet,
    }),
  ]);

  await transaction.execute(
    [options.wallet],
    [createProfileInstruction, ...createTokenAccountInstructions],
    commitment,
  );
}
