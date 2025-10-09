import * as kit from "@solana/kit";

import * as solagramProgramClient from "../../../../../clients/js/src/generated/solagram";

import * as pda from "../pda";
import * as plugins from "../plugins";

import * as transaction from "../../../transaction";
import * as error from "../../../error";

interface AdditionalParameters {
  airdropAmount?: number,
  mint?: kit.Address,
}

export async function installPlugin(
  wallet: kit.KeyPairSigner,

  plugin: kit.Address,
  pluginType: plugins.types.PluginType,

  additionalParameters: AdditionalParameters = {},
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

  const installPluginInstruction = await (async () => {
    switch (pluginType) {
      case "communication":
        return solagramProgramClient.getInstallComunicationPluginInstruction({
          ...installPluginInstructionOptions,
          communicationPluginListState: pluginState,
        });

      case "token":
        const platformTokenStatePDA = await pda.getPlatformTokenStatePDA(plugin);
        const platformTokenTreasuryStatePDA = await pda.getPlatformTokenTreasuryStatePDA(plugin);

        if (!additionalParameters.airdropAmount)
          additionalParameters.airdropAmount = plugins.constants.DEFAULT_TOKEN_AIRDROP_AMOUNT;

        if (!additionalParameters.mint) throw new Error("Mint address should be provided");

        return solagramProgramClient.getInstallTokenPluginInstruction({
          ...installPluginInstructionOptions,
          tokenPluginListState: pluginState,

          airdropAmount: additionalParameters.airdropAmount,
          mint: additionalParameters.mint,
          
          platformTokenState: platformTokenStatePDA,
          platformTokenTreasuryState: platformTokenTreasuryStatePDA,
        });

      case "application":
        return solagramProgramClient.getInstallApplicationPluginInstruction({
          ...installPluginInstructionOptions,
          applicationPluginListState: pluginState,
        });

      default: throw new error.PluginTypeIsNotSupported();
    }
  })();

  await transaction.executeTransaction([wallet], [installPluginInstruction]);
}
