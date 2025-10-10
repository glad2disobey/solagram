#![allow(unexpected_cfgs)]

pub mod platform;

pub mod plugin_api;
pub mod utils;

pub mod constants;
pub mod errors;

use anchor_lang::prelude::*;

use platform::instructions::*;
use plugin_api::instructions::conversation_actions::*;

declare_id!("7W7K9yAshEJBgPRNPW1fDiXuVDzjKBPcBWCC6UGrWxKC");

#[program]
pub mod solagram {
  use super::*;

  pub fn initialize(
    ctx: Context<InitializeGlobalState>,
  ) -> Result<()> {
    initialize::initialize_global_state(ctx)
  }

  pub fn install_comunication_plugin(
    ctx: Context<InstallCommunicationPlugin>,
    params: platform::states::InstallPluginParams,
  ) -> Result<()> {
    admin_actions::install_communication_plugin(ctx, params)
  }

  pub fn install_token_plugin(
    ctx: Context<InstallTokenPlugin>,
    params: platform::states::InstallPluginParams,
    token_params: plugin_api::states::SetPlatformTokenParams,
  ) -> Result<()> {
    admin_actions::install_token_plugin(ctx, params, token_params)
  }

  pub fn install_application_plugin(
    ctx: Context<InstallApplicationPlugin>,
    params: platform::states::InstallPluginParams,
  ) -> Result<()> {
    admin_actions::install_application_plugin(ctx, params)
  }

  pub fn uninstall_communication_plugin(
    ctx: Context<UninstallCommunicationPlugin>,
    params: platform::states::UninstallPluginParams,
  ) -> Result<()> {
    admin_actions::uninstall_communication_plugin(ctx, params)
  }

  pub fn uninstall_token_plugin(
    ctx: Context<UninstallTokenPlugin>,
    params: platform::states::UninstallPluginParams,
  ) -> Result<()> {
    admin_actions::uninstall_token_plugin(ctx, params)
  }

  pub fn uninstall_application_plugin(
    ctx: Context<UninstallApplicationPlugin>,
    params: platform::states::UninstallPluginParams,
  ) -> Result<()> {
    admin_actions::uninstall_application_plugin(ctx, params)
  }

  pub fn create_profile(
    ctx: Context<CreateProfile>,
    name: String,
  ) -> Result<()> {
    profile_actions::create_profile(ctx, name)
  }

  pub fn create_token_account(
    ctx: Context<CreateTokenAccount>,
    token_plugin: Pubkey,
  ) -> Result<()> {
    profile_actions::create_token_account(ctx, token_plugin)
  }

  pub fn register_conversation(
    ctx: Context<RegisterConversation>,
    params: plugin_api::states::RegisterPlatformConversationParams,
  ) -> Result<()> {
    plugin_api::instructions::register_conversation(ctx, params)
  }

  pub fn add_conversation_participant(
    ctx: Context<AddConversationParticipant>,
    params: plugin_api::states::AddPlatformConversationParticipantParams
  ) -> Result<()> {
    plugin_api::instructions::add_conversation_participant(ctx, params)
  }
}
