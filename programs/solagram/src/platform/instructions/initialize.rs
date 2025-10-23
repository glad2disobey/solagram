use anchor_lang::prelude::*;

use crate::platform::{ states };
use crate::{ plugin_api, utils, constants };

#[derive(Accounts)]
pub struct InitializeGlobalState<'info> {
  #[account(
    init,

    space = utils::constants::ANCHOR_DISCRIMINATOR_SIZE + states::GlobalState::INIT_SPACE,
    seeds = [String::from(constants::GLOBAL_STATE_SEED_KEY).as_bytes()],
    bump,

    payer = admin,
  )]
  pub global_state: Account<'info, states::GlobalState>,

  #[account(
    init,

    space = utils::pubkeys::PubkeyList::space_for(0, plugin_api::constants::MAX_COMMUNICATION_PLUGINS_COUNT).unwrap(),
    seeds = [String::from(plugin_api::constants::COMMUNICATION_PLUGIN_LIST_STATE_SEED_KEY).as_bytes()],
    bump,

    payer = admin,
  )]
  pub communication_plugin_list_state: Account<'info, utils::pubkeys::PubkeyList>,

  #[account(
    init,

    space = utils::pubkeys::PubkeyList::space_for(0, plugin_api::constants::MAX_TOKEN_PLUGINS_COUNT).unwrap(),
    seeds = [String::from(plugin_api::constants::TOKEN_PLUGIN_LIST_STATE_SEED_KEY).as_bytes()],
    bump,

    payer = admin,
  )]
  pub token_plugin_list_state: Account<'info, utils::pubkeys::PubkeyList>,

  #[account(
    init,

    space = utils::pubkeys::PubkeyList::space_for(0, plugin_api::constants::MAX_APPLICATION_PLUGINS_COUNT).unwrap(),
    seeds = [String::from(plugin_api::constants::APPLICATION_PLUGIN_LIST_STATE_SEED_KEY).as_bytes()],
    bump,

    payer = admin,
  )]
  pub application_plugin_list_state: Account<'info, utils::pubkeys::PubkeyList>,

  #[account(mut)]
  pub admin: Signer<'info>,
  pub system_program: Program<'info, System>,
}

pub fn initialize_global_state(
  ctx: Context<InitializeGlobalState>,
) -> Result<()> {
  let global_state = &mut ctx.accounts.global_state;

  global_state.admin = ctx.accounts.admin.key();
  global_state.profile_counter = 0;

  let communication_plugin_list_state = &mut ctx.accounts.communication_plugin_list_state;
  let token_plugin_list_state = &mut ctx.accounts.token_plugin_list_state;
  let application_plugin_list_state = &mut ctx.accounts.application_plugin_list_state;

  communication_plugin_list_state.pubkeys = Vec::new();
  communication_plugin_list_state.bump = ctx.bumps.communication_plugin_list_state;

  token_plugin_list_state.pubkeys = Vec::new();
  token_plugin_list_state.bump = ctx.bumps.token_plugin_list_state;

  application_plugin_list_state.pubkeys = Vec::new();
  application_plugin_list_state.bump = ctx.bumps.application_plugin_list_state;
  
  Ok(())
}
