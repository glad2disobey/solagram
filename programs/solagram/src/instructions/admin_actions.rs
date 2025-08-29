use anchor_lang::prelude::*;

use crate::{ states, constants, errors };

use plugin_api;
use utils::lists;

#[derive(Accounts)]
#[instruction(params: states::InstallPluginParams)]
pub struct InstallCommunicationPlugin<'info> {
  #[account(
    mut,
    seeds = [String::from(plugin_api::constants::COMMUNICATION_PLUGIN_LIST_STATE_SEED_KEY).as_bytes()],
    bump = communication_plugin_list_state.bump,

    realloc = lists::PubkeyList::space_for(
      communication_plugin_list_state.pubkeys.len() + 1,
      plugin_api::constants::MAX_COMMUNICATION_PLUGINS_COUNT,
    ).unwrap(),
    realloc::payer = admin,
    realloc::zero = false,
  )]
  pub communication_plugin_list_state: Account<'info, lists::PubkeyList>,

  #[account(
    seeds = [String::from(constants::GLOBAL_STATE_SEED_KEY).as_bytes()],
    bump,
    constraint = admin.key().as_ref() == global_state.admin.key().as_ref()
      @ errors::SolagramError::Unauthorized,
  )]
  pub global_state: Account<'info, states::GlobalState>,

  #[account(mut)]
  pub admin: Signer<'info>,
  pub system_program: Program<'info, System>,
}

pub fn install_communication_plugin(
  ctx: Context<InstallCommunicationPlugin>,
  params: states::InstallPluginParams,
) -> Result<()> {
  let communication_plugin_list_state = &mut ctx.accounts.communication_plugin_list_state;

  require!(
    !communication_plugin_list_state.pubkeys.contains(&params.plugin),
    errors::SolagramError::PluginAlreadyInstalled,
  );

  require!(
    communication_plugin_list_state.pubkeys.len() < plugin_api::constants::MAX_COMMUNICATION_PLUGINS_COUNT,
    errors::SolagramError::PluginLimitExceeded
  );

  communication_plugin_list_state.pubkeys.push(params.plugin);
  msg!("len: {}", communication_plugin_list_state.pubkeys.len());
  
  Ok(())
}

#[derive(Accounts)]
#[instruction(params: states::InstallPluginParams)]
pub struct InstallTokenPlugin<'info> {
  #[account(
    mut,
    seeds = [String::from(plugin_api::constants::TOKEN_PLUGIN_LIST_STATE_SEED_KEY).as_bytes()],
    bump = token_plugin_list_state.bump,

    realloc = lists::PubkeyList::space_for(
      token_plugin_list_state.pubkeys.len() + 1,
      plugin_api::constants::MAX_TOKEN_PLUGINS_COUNT,
    ).unwrap(),
    realloc::payer = admin,
    realloc::zero = false,
  )]
  pub token_plugin_list_state: Account<'info, lists::PubkeyList>,

  #[account(
    seeds = [String::from(constants::GLOBAL_STATE_SEED_KEY).as_bytes()],
    bump,
    constraint = admin.key().as_ref() == global_state.admin.key().as_ref()
      @ errors::SolagramError::Unauthorized,
  )]
  pub global_state: Account<'info, states::GlobalState>,

  #[account(mut)]
  pub admin: Signer<'info>,
  pub system_program: Program<'info, System>,
}

pub fn install_token_plugin(
  ctx: Context<InstallTokenPlugin>,
  params: states::InstallPluginParams,
) -> Result<()> {
  let token_plugin_list_state = &mut ctx.accounts.token_plugin_list_state;

  require!(
    !token_plugin_list_state.pubkeys.contains(&params.plugin),
    errors::SolagramError::PluginAlreadyInstalled,
  );

  require!(
    token_plugin_list_state.pubkeys.len() < plugin_api::constants::MAX_TOKEN_PLUGINS_COUNT,
    errors::SolagramError::PluginLimitExceeded
  );

  token_plugin_list_state.pubkeys.push(params.plugin);
  
  Ok(())
}

#[derive(Accounts)]
#[instruction(params: states::InstallPluginParams)]
pub struct InstallApplicationPlugin<'info> {
  #[account(
    mut,
    seeds = [String::from(plugin_api::constants::APPLICATION_PLUGIN_LIST_STATE_SEED_KEY).as_bytes()],
    bump = application_plugin_list_state.bump,

    realloc = lists::PubkeyList::space_for(
      application_plugin_list_state.pubkeys.len() + 1,
      plugin_api::constants::MAX_APPLICATION_PLUGINS_COUNT,
    ).unwrap(),
    realloc::payer = admin,
    realloc::zero = false,
  )]
  pub application_plugin_list_state: Account<'info, lists::PubkeyList>,

  #[account(
    seeds = [String::from(constants::GLOBAL_STATE_SEED_KEY).as_bytes()],
    bump,
    constraint = admin.key().as_ref() == global_state.admin.key().as_ref()
      @ errors::SolagramError::Unauthorized,
  )]
  pub global_state: Account<'info, states::GlobalState>,
  
  #[account(mut)]
  pub admin: Signer<'info>,
  pub system_program: Program<'info, System>,
}

pub fn install_application_plugin(
  ctx: Context<InstallApplicationPlugin>,
  params: states::InstallPluginParams,
) -> Result<()> {
  let application_plugin_list_state = &mut ctx.accounts.application_plugin_list_state;

  require!(
    !application_plugin_list_state.pubkeys.contains(&params.plugin),
    errors::SolagramError::PluginAlreadyInstalled,
  );

  require!(
    application_plugin_list_state.pubkeys.len() < plugin_api::constants::MAX_APPLICATION_PLUGINS_COUNT,
    errors::SolagramError::PluginLimitExceeded
  );

  application_plugin_list_state.pubkeys.push(params.plugin);
  
  Ok(())
}
