use anchor_lang::prelude::*;

use anchor_spl::{
  token_interface::{
    Mint, Token2022, TokenAccount,
  },
};

use crate::{
  platform::{ states },

  plugin_api, utils, constants, errors,
};

#[derive(Accounts)]
#[instruction(params: states::InstallPluginParams)]
pub struct InstallCommunicationPlugin<'info> {
  #[account(
    mut,

    seeds = [String::from(plugin_api::constants::COMMUNICATION_PLUGIN_LIST_STATE_SEED_KEY).as_bytes()],
    bump = communication_plugin_list_state.bump,

    realloc = utils::pubkeys::PubkeyList::space_for(
      communication_plugin_list_state.pubkeys.len() + 1,
      plugin_api::constants::MAX_COMMUNICATION_PLUGINS_COUNT,
    ).unwrap(),
    realloc::payer = admin,
    realloc::zero = false,
  )]
  pub communication_plugin_list_state: Account<'info, utils::pubkeys::PubkeyList>,

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
    errors::SolagramError::PluginLimitExceeded,
  );

  communication_plugin_list_state.pubkeys.push(params.plugin);
  
  Ok(())
}

#[derive(Accounts)]
#[instruction(params: states::InstallPluginParams, token_params: plugin_api::SetPlatformTokenParams)]
pub struct InstallTokenPlugin<'info> {
  #[account(
    init,

    space = utils::constants::ANCHOR_DISCRIMINATOR_SIZE + plugin_api::states::PlatformTokenState::INIT_SPACE,
    seeds = [
      String::from(plugin_api::constants::PLATFORM_TOKEN_STATE_SEED_KEY).as_bytes(),
      params.plugin.as_ref(),
    ],
    bump,

    payer = admin,
  )]
  pub platform_token_state: Account<'info, plugin_api::states::PlatformTokenState>,

  #[account(
    init,

    token::mint = mint,
    token::authority = platform_token_treasury_state,
    token::token_program = token_program,

    seeds = [
      String::from(plugin_api::constants::PLATFORM_TOKEN_TREASURY_STATE_SEED_KEY).as_bytes(),
      params.plugin.as_ref(),
    ],
    bump,

    payer = admin,
  )]
  pub platform_token_treasury_state: InterfaceAccount<'info, TokenAccount>,

  #[account(
    mut,

    seeds = [String::from(plugin_api::constants::TOKEN_PLUGIN_LIST_STATE_SEED_KEY).as_bytes()],
    bump = token_plugin_list_state.bump,

    realloc = utils::pubkeys::PubkeyList::space_for(
      token_plugin_list_state.pubkeys.len() + 1,
      plugin_api::constants::MAX_TOKEN_PLUGINS_COUNT,
    ).unwrap(),
    realloc::payer = admin,
    realloc::zero = false,
  )]
  pub token_plugin_list_state: Account<'info, utils::pubkeys::PubkeyList>,

  #[account(
    seeds = [String::from(constants::GLOBAL_STATE_SEED_KEY).as_bytes()],
    bump,

    constraint = admin.key().as_ref() == global_state.admin.key().as_ref()
      @ errors::SolagramError::Unauthorized,
  )]
  pub global_state: Account<'info, states::GlobalState>,

  #[account(mut)]
  pub admin: Signer<'info>,

  pub mint: InterfaceAccount<'info, Mint>,
  pub token_program: Program<'info, Token2022>,
  pub system_program: Program<'info, System>,
}

pub fn install_token_plugin(
  ctx: Context<InstallTokenPlugin>,
  params: states::InstallPluginParams,
  token_params: plugin_api::SetPlatformTokenParams,
) -> Result<()> {
  let token_plugin_list_state = &mut ctx.accounts.token_plugin_list_state;
  let platform_token_state = &mut ctx.accounts.platform_token_state;

  require!(
    !token_plugin_list_state.pubkeys.contains(&params.plugin),
    errors::SolagramError::PluginAlreadyInstalled,
  );

  require!(
    token_plugin_list_state.pubkeys.len() < plugin_api::constants::MAX_TOKEN_PLUGINS_COUNT,
    errors::SolagramError::PluginLimitExceeded,
  );

  token_plugin_list_state.pubkeys.push(params.plugin);

  platform_token_state.mint_address = ctx.accounts.mint.key();
  platform_token_state.airdrop_amount = token_params.airdrop_amount;
  
  Ok(())
}

#[derive(Accounts)]
#[instruction(params: states::InstallPluginParams)]
pub struct InstallApplicationPlugin<'info> {
  #[account(
    mut,

    seeds = [String::from(plugin_api::constants::APPLICATION_PLUGIN_LIST_STATE_SEED_KEY).as_bytes()],
    bump = application_plugin_list_state.bump,

    realloc = utils::pubkeys::PubkeyList::space_for(
      application_plugin_list_state.pubkeys.len() + 1,
      plugin_api::constants::MAX_APPLICATION_PLUGINS_COUNT,
    ).unwrap(),
    realloc::payer = admin,
    realloc::zero = false,
  )]
  pub application_plugin_list_state: Account<'info, utils::pubkeys::PubkeyList>,

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
    errors::SolagramError::PluginLimitExceeded,
  );

  application_plugin_list_state.pubkeys.push(params.plugin);
  
  Ok(())
}

#[derive(Accounts)]
#[instruction(params: states::UninstallPluginParams)]
pub struct UninstallCommunicationPlugin<'info> {
  #[account(
    mut,

    seeds = [String::from(plugin_api::constants::COMMUNICATION_PLUGIN_LIST_STATE_SEED_KEY).as_bytes()],
    bump = communication_plugin_list_state.bump,

    realloc = utils::pubkeys::PubkeyList::space_for(
      communication_plugin_list_state.pubkeys.len() - 1,
      plugin_api::constants::MAX_COMMUNICATION_PLUGINS_COUNT,
    ).unwrap(),
    realloc::payer = admin,
    realloc::zero = false,
  )]
  pub communication_plugin_list_state: Account<'info, utils::pubkeys::PubkeyList>,

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

pub fn uninstall_communication_plugin(
  ctx: Context<UninstallCommunicationPlugin>,
  params: states::UninstallPluginParams,
) -> Result<()> {
  let communication_plugin_list_state = &mut ctx.accounts.communication_plugin_list_state;

  require!(
    communication_plugin_list_state.pubkeys.contains(&params.plugin),
    errors::SolagramError::PluginNotFound,
  );

  let plugin_index = communication_plugin_list_state.pubkeys
    .iter().position(|x| x == &params.plugin).unwrap();

  communication_plugin_list_state.pubkeys.remove(plugin_index);
  
  Ok(())
}

#[derive(Accounts)]
#[instruction(params: states::UninstallPluginParams)]
pub struct UninstallTokenPlugin<'info> {
  #[account(
    mut,

    seeds = [
      String::from(plugin_api::constants::PLATFORM_TOKEN_STATE_SEED_KEY).as_bytes(),
      params.plugin.as_ref(),
    ],
    bump,

    close = admin,
  )]
  pub platform_token_state: Account<'info, plugin_api::states::PlatformTokenState>,

  #[account(
    mut,

    seeds = [String::from(plugin_api::constants::TOKEN_PLUGIN_LIST_STATE_SEED_KEY).as_bytes()],
    bump = token_plugin_list_state.bump,

    realloc = utils::pubkeys::PubkeyList::space_for(
      token_plugin_list_state.pubkeys.len() - 1,
      plugin_api::constants::MAX_TOKEN_PLUGINS_COUNT,
    ).unwrap(),
    realloc::payer = admin,
    realloc::zero = false,
  )]
  pub token_plugin_list_state: Account<'info, utils::pubkeys::PubkeyList>,

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

pub fn uninstall_token_plugin(
  ctx: Context<UninstallTokenPlugin>,
  params: states::UninstallPluginParams,
) -> Result<()> {
  let token_plugin_list_state = &mut ctx.accounts.token_plugin_list_state;

  require!(
    token_plugin_list_state.pubkeys.contains(&params.plugin),
    errors::SolagramError::PluginNotFound,
  );

  let plugin_index = token_plugin_list_state.pubkeys
    .iter().position(|x| x == &params.plugin).unwrap();

  token_plugin_list_state.pubkeys.remove(plugin_index);
  
  Ok(())
}

#[derive(Accounts)]
#[instruction(params: states::UninstallPluginParams)]
pub struct UninstallApplicationPlugin<'info> {
  #[account(
    mut,

    seeds = [String::from(plugin_api::constants::APPLICATION_PLUGIN_LIST_STATE_SEED_KEY).as_bytes()],
    bump = application_plugin_list_state.bump,

    realloc = utils::pubkeys::PubkeyList::space_for(
      application_plugin_list_state.pubkeys.len() - 1,
      plugin_api::constants::MAX_APPLICATION_PLUGINS_COUNT,
    ).unwrap(),
    realloc::payer = admin,
    realloc::zero = false,
  )]
  pub application_plugin_list_state: Account<'info, utils::pubkeys::PubkeyList>,

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

pub fn uninstall_application_plugin(
  ctx: Context<UninstallApplicationPlugin>,
  params: states::UninstallPluginParams,
) -> Result<()> {
  let application_plugin_list_state = &mut ctx.accounts.application_plugin_list_state;

  require!(
    application_plugin_list_state.pubkeys.contains(&params.plugin),
    errors::SolagramError::PluginNotFound,
  );

  let plugin_index = application_plugin_list_state.pubkeys
    .iter().position(|x| x == &params.plugin).unwrap();

  application_plugin_list_state.pubkeys.remove(plugin_index);
  
  Ok(())
}
