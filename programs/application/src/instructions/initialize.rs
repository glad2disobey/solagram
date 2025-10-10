use anchor_lang::prelude::*;

use crate::{ states, constants };

use solagram::utils;

#[derive(Accounts)]
#[instruction(params: states::InitalizeGlobalStateParams)]
pub struct InitializeGlobalState<'info> {
  #[account(
    init,
    payer = admin,
    space = utils::constants::ANCHOR_DISCRIMINATOR_SIZE + states::GlobalState::INIT_SPACE,
    seeds = [String::from(constants::GLOBAL_STATE_SEED_KEY).as_bytes()],
    bump,
  )]
  pub global_state: Account<'info, states::GlobalState>,

  #[account(mut)]
  pub admin: Signer<'info>,
  pub system_program: Program<'info, System>,
}

pub fn initialize_global_state(
  ctx: Context<InitializeGlobalState>,
  params: states::InitalizeGlobalStateParams,
) -> Result<()> {
  let global_state = &mut ctx.accounts.global_state;

  global_state.platform = params.platform;

  global_state.name = String::from(constants::DEFAULT_APPLICATION_NAME);
  global_state.description = String::from(constants::DEFAULT_APPLICATION_DESCRIPTION);

  global_state.session_counter = 0;
  
  Ok(())
}
