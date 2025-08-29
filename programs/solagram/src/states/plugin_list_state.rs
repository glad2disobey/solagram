use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub enum PluginListAction {
  InstallPlugin,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct InstallPluginParams {
  pub plugin: Pubkey,
}
