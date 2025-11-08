#![allow(unexpected_cfgs)]

pub mod platform;

pub mod plugin_api;
pub mod utils;

pub mod constants;
pub mod errors;

use anchor_lang::prelude::*;

use platform::instructions::*;
use plugin_api::instructions::conversation_actions::*;
use plugin_api::instructions::session_actions::*;

declare_id!("7W7K9yAshEJBgPRNPW1fDiXuVDzjKBPcBWCC6UGrWxKC");

#[program]
pub mod solagram {
  use super::*;

  pub fn initialize(
    ctx: Context<InitializeGlobalState>,
  ) -> Result<()> {
    initialize::initialize_global_state(ctx)
  }

  pub fn install_communication_plugin(
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

  pub fn register_platform_session(
    ctx: Context<RegisterPlatformSession>,
    params: plugin_api::states::RegisterPlatformSessionParams,
  ) -> Result<()> {
    plugin_api::instructions::register_platform_session(ctx, params)
  }

  pub fn invite_platform_session(
    ctx: Context<InvitePlatformSession>,
    params: plugin_api::states::InvitePlatformSessionParams,
  ) -> Result<()> {
    plugin_api::instructions::invite_platform_session(ctx, params)
  }

  pub fn sign_platform_session(
    ctx: Context<SignPlatformSession>,
    params: plugin_api::states::SignPlatformSessionParams,
  ) -> Result<()> {
    plugin_api::instructions::sign_platform_session(ctx, params)
  }

  pub fn abort_platform_session<'info>(
    ctx: Context<'_, '_, '_, 'info, AbortPlatformSession<'info>>,
    params: plugin_api::states::AbortPlatformSessionParams,
  ) -> Result<()> {
    plugin_api::instructions::abort_platform_session(ctx, params)
  }

  pub fn set_recipient<'info>(
    ctx: Context<SetRecipient>,
    params: plugin_api::states::SetRecipientParams,
  ) -> Result<()> {
    plugin_api::instructions::set_recipient(ctx, params)
  }

  pub fn close_platform_session<'info>(
    ctx: Context<'_, '_, '_, 'info, ClosePlatformSession<'info>>,
    params: plugin_api::states::ClosePlatformSessionParams,
  ) -> Result<()> {
    plugin_api::instructions::close_platform_session(ctx, params)
  }

  pub fn purge_profile_sessions<'info>(
    ctx: Context<PurgeProfileSessions>,
    params: plugin_api::states::PurgeProfileSessionsParams,
  ) -> Result<()> {
    plugin_api::instructions::purge_profile_sessions(ctx, params)
  }
}
