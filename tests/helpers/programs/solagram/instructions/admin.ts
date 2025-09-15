import * as kit from "@solana/kit";

import * as solagramProgramClient from "../../../../../clients/js/src/generated/solagram";

import * as pda from "../pda";
import * as plugins from "../plugins";

import * as transaction from "../../../transaction";
import * as error from "../../../error";

export async function installPlugin(
  wallet: kit.KeyPairSigner,

  plugin: kit.Address,

  pluginType: plugins.types.PluginType,
) {
  const globalState = await pda.getGlobalStatePDA();
  const pluginState = await pda.getPluginStatePDA(pluginType);

  const installPluginInstructionOptions = {
    globalState,

    admin: wallet,

    params: {
      plugin,
    }
  };

  const installPluginInstruction = (() => {
    switch (pluginType) {
      case "communication":
        return solagramProgramClient.getInstallComunicationPluginInstruction({
          ...installPluginInstructionOptions,
          communicationPluginListState: pluginState,
        });

      case "token":
        return solagramProgramClient.getInstallTokenPluginInstruction({
          ...installPluginInstructionOptions,
          tokenPluginListState: pluginState,
        });

      case "application":
        return solagramProgramClient.getInstallApplicationPluginInstruction({
          ...installPluginInstructionOptions,
          applicationPluginListState: pluginState,
        });

      default: throw new error.PluginTypeIsNotSupported();
    }
  })();

  await transaction.executeTransaction(wallet, [installPluginInstruction]);
}
