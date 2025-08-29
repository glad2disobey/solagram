use anchor_lang::prelude::*;

use crate::{ states, constants };

use plugin_api;
use utils;

#[derive(Accounts)]
#[instruction(params: states::InitializeGlobalStateParams)]
pub struct InitializeGlobalState<'info> {
  #[account(
    init,
    payer = admin,
    space = utils::constants::ANCHOR_DISCRIMINATOR_SIZE + states::GlobalState::INIT_SPACE,
    seeds = [String::from(constants::GLOBAL_STATE_SEED_KEY).as_bytes()],
    bump
  )]
  pub global_state: Account<'info, states::GlobalState>,

  #[account(
    init,
    payer = admin,
    space = utils::lists::PubkeyList::space_for(0, plugin_api::constants::MAX_COMMUNICATION_PLUGINS_COUNT).unwrap(),
    seeds = [String::from(plugin_api::constants::COMMUNICATION_PLUGIN_LIST_STATE_SEED_KEY).as_bytes()],
    bump
  )]
  pub communication_plugin_list_state: Account<'info, utils::lists::PubkeyList>,

  #[account(
    init,
    payer = admin,
    space = utils::lists::PubkeyList::space_for(0, plugin_api::constants::MAX_TOKEN_PLUGINS_COUNT).unwrap(),
    seeds = [String::from(plugin_api::constants::TOKEN_PLUGIN_LIST_STATE_SEED_KEY).as_bytes()],
    bump
  )]
  pub token_plugin_list_state: Account<'info, utils::lists::PubkeyList>,

  #[account(
    init,
    payer = admin,
    space = utils::lists::PubkeyList::space_for(0, plugin_api::constants::MAX_APPLICATION_PLUGINS_COUNT).unwrap(),
    seeds = [String::from(plugin_api::constants::APPLICATION_PLUGIN_LIST_STATE_SEED_KEY).as_bytes()],
    bump
  )]
  pub application_plugin_list_state: Account<'info, utils::lists::PubkeyList>,

  #[account(mut)]
  pub admin: Signer<'info>,
  pub system_program: Program<'info, System>,
}

pub fn initialize_global_state(
  ctx: Context<InitializeGlobalState>,
  params: states::InitializeGlobalStateParams,
) -> Result<()> {
  let global_state = &mut ctx.accounts.global_state;

  let communication_plugin_list_state = &mut ctx.accounts.communication_plugin_list_state;
  let token_plugin_list_state = &mut ctx.accounts.token_plugin_list_state;
  let application_plugin_list_state = &mut ctx.accounts.application_plugin_list_state;

  communication_plugin_list_state.pubkeys = Vec::new();
  communication_plugin_list_state.bump = ctx.bumps.communication_plugin_list_state;

  token_plugin_list_state.pubkeys = Vec::new();
  token_plugin_list_state.bump = ctx.bumps.token_plugin_list_state;

  application_plugin_list_state.pubkeys = Vec::new();
  application_plugin_list_state.bump = ctx.bumps.application_plugin_list_state;

  global_state.admin = params.admin;
  
  Ok(())
}
