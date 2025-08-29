import * as kit from "@solana/kit";

import * as programClient from "../../../../clients/js/src/generated";

import * as helpers from "../../../helpers";

export async function initializeProgram(wallet: kit.KeyPairSigner): Promise<kit.Address[]> {
  const getProgramDerivedAddressOptions = {
    programAddress: programClient.SOLAGRAM_PROGRAM_ADDRESS,
  };

  const [globalStatePDA] = await kit.getProgramDerivedAddress({
    ...getProgramDerivedAddressOptions,
    seeds: helpers.encoder.encodeSeeds([helpers.programs.solagram.constants.GLOBAL_STATE_SEED_KEY]),
  });

  const [communicationStatePDA] = await kit.getProgramDerivedAddress({
    ...getProgramDerivedAddressOptions,
    seeds: helpers.encoder.encodeSeeds([helpers.libs.plugins.constants.COMMUNICATION_PLUGIN_LIST_STATE_SEED_KEY]),
  });

  const [tokenStatePDA] = await kit.getProgramDerivedAddress({
    ...getProgramDerivedAddressOptions,
    seeds: helpers.encoder.encodeSeeds([helpers.libs.plugins.constants.TOKEN_PLUGIN_LIST_STATE_SEED_KEY]),
  });

  const [applicationStatePDA] = await kit.getProgramDerivedAddress({
    ...getProgramDerivedAddressOptions,
    seeds: helpers.encoder.encodeSeeds([helpers.libs.plugins.constants.APPLICATION_PLUGIN_LIST_STATE_SEED_KEY]),
  });

  const initializeGlobalStateInstruction = programClient.getInitializeInstruction({
    admin: wallet,
    globalState: globalStatePDA,
    adminArg: wallet.address,

    communicationPluginListState: communicationStatePDA,
    tokenPluginListState: tokenStatePDA,
    applicationPluginListState: applicationStatePDA,
  });

  await helpers.transaction.executeTransactions(wallet, [initializeGlobalStateInstruction]);

  return [globalStatePDA, communicationStatePDA, tokenStatePDA, applicationStatePDA];
}
