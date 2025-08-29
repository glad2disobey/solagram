#![allow(unexpected_cfgs)]

pub mod instructions;
pub mod states;

pub mod constants;
pub mod errors;

use anchor_lang::prelude::*;
use instructions::*;

declare_id!("7W7K9yAshEJBgPRNPW1fDiXuVDzjKBPcBWCC6UGrWxKC");

#[program]
pub mod solagram {
  use super::*;

  pub fn initialize(
    ctx: Context<InitializeGlobalState>,
    params: states::InitializeGlobalStateParams,
  ) -> Result<()> {
    instructions::initialize::initialize_global_state(ctx, params)
  }

  pub fn install_comunication_plugin(
    ctx: Context<InstallCommunicationPlugin>,
    params: states::InstallPluginParams,
  ) -> Result<()> {
    instructions::install_communication_plugin(ctx, params)
  }

  pub fn install_token_plugin(
    ctx: Context<InstallTokenPlugin>,
    params: states::InstallPluginParams,
  ) -> Result<()> {
    instructions::install_token_plugin(ctx, params)
  }

  pub fn install_application_plugin(
    ctx: Context<InstallApplicationPlugin>,
    params: states::InstallPluginParams,
  ) -> Result<()> {
    instructions::install_application_plugin(ctx, params)
  }

  pub fn create_profile(
    ctx: Context<CreateProfile>,
    name: String,
  ) -> Result<()> {
    instructions::profile_actions::create_profile(ctx, name)
  }
}
