import * as kit from "@solana/kit";

import * as programClient from "../../../../clients/js/src/generated";

import * as helpers from "../../../helpers";

export async function createProfile(globalStatePDA: kit.Address, wallet: kit.KeyPairSigner, name: string): Promise<kit.Address> {
  const [profileStatePDA] = await kit.getProgramDerivedAddress({
    programAddress: programClient.SOLAGRAM_PROGRAM_ADDRESS,
    seeds: helpers.encoder.encodeSeeds([helpers.programs.solagram.constants.PROFILE_STATE_SEED_KEY, wallet.address]),
  });

  const createProfileInstruction = programClient.getCreateProfileInstruction({
    name,
    signer: wallet,
    profileState: profileStatePDA,

    globalState: globalStatePDA,
  });

  await helpers.transaction.executeTransactions(wallet, [createProfileInstruction]);

  return profileStatePDA;
}
