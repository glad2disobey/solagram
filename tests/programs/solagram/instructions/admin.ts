import * as kit from "@solana/kit";

import * as programClient from "../../../../clients/js/src/generated";

import * as helpers from "../../../helpers";

export async function installPlugin(
  wallet: kit.KeyPairSigner,

  globalStatePDA: kit.Address,

  plugin: kit.Address,

  pluginType: helpers.libs.plugins.types.PluginType,
): Promise<kit.Address> {
  const [pluginStatePDA] = await kit.getProgramDerivedAddress({
    programAddress: programClient.SOLAGRAM_PROGRAM_ADDRESS,
    seeds: helpers.encoder.encodeSeeds([
      helpers.libs.plugins.types.getPluginListSeedKey(pluginType),
    ]),
  });

  const installPluginInstructionOptions = {
    admin: wallet,
    globalState: globalStatePDA,

    params: {
      plugin,
    }
  };

  const installPluginInstruction = (() => {
    switch (pluginType) {
      case "communication":
        return programClient.getInstallComunicationPluginInstruction({
          ...installPluginInstructionOptions,
          communicationPluginListState: pluginStatePDA,
        });

      case "token":
        return programClient.getInstallTokenPluginInstruction({
          ...installPluginInstructionOptions,
          tokenPluginListState: pluginStatePDA,
        });

      case "application":
        return programClient.getInstallApplicationPluginInstruction({
          ...installPluginInstructionOptions,
          applicationPluginListState: pluginStatePDA,
        });

      default: throw new helpers.error.PluginTypeIsNotSupported();
    }
  })();

  await helpers.transaction.executeTransactions(wallet, [installPluginInstruction]);

  return pluginStatePDA;
}
