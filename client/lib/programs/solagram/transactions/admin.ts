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

export async function installPlugin(options: InstallPluginInterface, commitment: kit.Commitment = "confirmed") {
  const installPluginInstruction = await instructions.admin.getInstallPluginInstruction(options);

  await transation.execute([options.wallet], [installPluginInstruction], commitment);
}

interface UninstallPluginInterface {
  plugin: kit.Address,
  pluginType: plugins.types.PluginType,

  wallet: kit.KeyPairSigner,
}

export async function uninstallPlugin(options: UninstallPluginInterface, commitment: kit.Commitment = "confirmed") {
  const uninstallPluginInstruction = await instructions.admin.getUninstallPluginInstruction(options);

  await transation.execute([options.wallet], [uninstallPluginInstruction], commitment);
}
