import * as kit from "@solana/kit";

import * as plugins from "../plugins";
import * as instructions from "../instructions";

import * as transation from "../../../transaction";

interface InstallPluginInterface {
  plugin: kit.Address,
  pluginType: plugins.types.PluginType,

  airdropAmount?: bigint,
  mint?: kit.Address,

  wallet: kit.KeyPairSigner,
}

export async function installPlugin(options: InstallPluginInterface) {
  const installPluginInstruction = await instructions.admin.getInstallPluginInstruction(options);

  await transation.executeTransaction([options.wallet], [installPluginInstruction]);
}

interface UninstallPluginInterface {
  plugin: kit.Address,
  pluginType: plugins.types.PluginType,

  wallet: kit.KeyPairSigner,
}

export async function uninstallPlugin(options: UninstallPluginInterface) {
  const uninstallPluginInstruction = await instructions.admin.getUninstallPluginInstruction(options);

  await transation.executeTransaction([options.wallet], [uninstallPluginInstruction]);
}
