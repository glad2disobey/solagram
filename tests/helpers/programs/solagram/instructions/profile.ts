import * as kit from "@solana/kit";

import * as solagramProgramClient from "../../../../../clients/js/src/generated/solagram";

import * as pda from "../pda";

import * as transaction from "../../../transaction";

export async function createProfile(wallet: kit.KeyPairSigner, name: string) {
  const globalState = await pda.getGlobalStatePDA();

  const profileState = await pda.getProfileStatePDA(wallet.address);
  const profileCommunicationListState = await pda.getProfileCommunicationListStatePDA(wallet.address);

  const createProfileInstruction = solagramProgramClient.getCreateProfileInstruction({
    globalState: globalState,
    profileState: profileState,

    profileCommunicationListState,

    name,
    signer: wallet,
  });

  await transaction.executeTransaction(wallet, [createProfileInstruction]);
}
