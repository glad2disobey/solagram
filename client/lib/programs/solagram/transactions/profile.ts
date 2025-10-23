import * as kit from "@solana/kit";

import * as instructions from "../instructions";

import * as transaction from "../../../transaction";

interface CreateProfileInterface {
  name: string,

  wallet: kit.KeyPairSigner,
}

export async function createProfile(options: CreateProfileInterface) {
  const createProfileInstruction = await instructions.profile.getCreateProfileInstruction({
    name: options.name,

    wallet: options.wallet,
  });

  const createTokenAccountInstructions = await instructions.profile.getCreateTokenAccountInstructions({
    wallet: options.wallet,
  });

  await transaction.executeTransaction([options.wallet], [createProfileInstruction, ...createTokenAccountInstructions]);
}
