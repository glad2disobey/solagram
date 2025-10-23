import * as kit from "@solana/kit";

import * as platformProgramClient from "../../../../../clients/js/src/generated/solagram";

import * as pda from "../pda";
import * as plugins from "../plugins";

import * as error from "../../../error";

interface GetInstallPluginInstructionInterface {
  plugin: kit.Address,
  pluginType: plugins.types.PluginType,

  airdropAmount?: bigint,
  mint?: kit.Address,

  wallet: kit.KeyPairSigner,
}

export type InstallPluginInstructionType = platformProgramClient.InstallCommunicationPluginInstruction
  | platformProgramClient.InstallTokenPluginInstruction
  | platformProgramClient.InstallApplicationPluginInstruction;

export async function getInstallPluginInstruction(
  options: GetInstallPluginInstructionInterface,
): Promise<InstallPluginInstructionType> {
  const globalState = await pda.getGlobalStatePDA();
  const pluginState = await pda.getPluginStatePDA(options.pluginType);

  const installPluginInstructionOptions = {
    globalState,

    params: {
      plugin: options.plugin,
    },

    admin: options.wallet,
  };

  switch (options.pluginType) {
    case "communication":
      return platformProgramClient.getInstallCommunicationPluginInstruction({
        ...installPluginInstructionOptions,
        communicationPluginListState: pluginState,
      }) as platformProgramClient.InstallCommunicationPluginInstruction;

    case "token":
      const platformTokenStatePDA = await pda.getPlatformTokenStatePDA(options.plugin);
      const platformTokenTreasuryStatePDA = await pda.getPlatformTokenTreasuryStatePDA(options.plugin);

      if (options.airdropAmount === undefined)
        options.airdropAmount = plugins.constants.DEFAULT_TOKEN_AIRDROP_AMOUNT;

      if (options.mint === undefined) throw new error.MintIsMissing();

      return platformProgramClient.getInstallTokenPluginInstruction({
        ...installPluginInstructionOptions,
        tokenPluginListState: pluginState,

        airdropAmount: options.airdropAmount,
        mint: options.mint,
        
        platformTokenState: platformTokenStatePDA,
        platformTokenTreasuryState: platformTokenTreasuryStatePDA,
      }) as platformProgramClient.InstallTokenPluginInstruction;

    case "application":
      return platformProgramClient.getInstallApplicationPluginInstruction({
        ...installPluginInstructionOptions,
        applicationPluginListState: pluginState,
      }) as platformProgramClient.InstallApplicationPluginInstruction;

    default: throw new error.PluginTypeIsNotSupported();
  }
}

interface GetUninstallPluginInstructionInterface {
  plugin: kit.Address,
  pluginType: plugins.types.PluginType,

  wallet: kit.KeyPairSigner,
}

export type UninstallPluginInstructionType = platformProgramClient.UninstallCommunicationPluginInstruction
  | platformProgramClient.UninstallTokenPluginInstruction
  | platformProgramClient.UninstallApplicationPluginInstruction;

export async function getUninstallPluginInstruction(
  options: GetUninstallPluginInstructionInterface,
): Promise<UninstallPluginInstructionType> {
  const globalState = await pda.getGlobalStatePDA();
  const pluginState = await pda.getPluginStatePDA(options.pluginType);

  const installPluginInstructionOptions = {
    globalState,

    params: {
      plugin: options.plugin,
    },

    admin: options.wallet,
  };

  switch (options.pluginType) {
    case "communication":
      return platformProgramClient.getUninstallCommunicationPluginInstruction({
        ...installPluginInstructionOptions,
        communicationPluginListState: pluginState,
      }) as platformProgramClient.UninstallCommunicationPluginInstruction;

    case "token":
      const platformTokenStatePDA = await pda.getPlatformTokenStatePDA(options.plugin);

      return platformProgramClient.getUninstallTokenPluginInstruction({
        ...installPluginInstructionOptions,
        tokenPluginListState: pluginState,
        
        platformTokenState: platformTokenStatePDA,
      }) as platformProgramClient.UninstallTokenPluginInstruction;

    case "application":
      return platformProgramClient.getUninstallApplicationPluginInstruction({
        ...installPluginInstructionOptions,
        applicationPluginListState: pluginState,
      }) as platformProgramClient.UninstallApplicationPluginInstruction;

    default: throw new error.PluginTypeIsNotSupported();
  }
}
