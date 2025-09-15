use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct InstallPluginParams {
  pub plugin: Pubkey,
}
