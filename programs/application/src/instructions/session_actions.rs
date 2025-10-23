use anchor_lang::prelude::*;

use crate::{ states, constants };

#[derive(Accounts)]
pub struct StartSession<'info> {
  #[account(
    mut,

    seeds = [String::from(constants::GLOBAL_STATE_SEED_KEY).as_bytes()],
    bump,
  )]
  pub global_state: Account<'info, states::GlobalState>,

  #[account(
    init,

    space = solagram::utils::constants::ANCHOR_DISCRIMINATOR_SIZE + states::SessionState::INIT_SPACE,
    seeds = [
      String::from(solagram::plugin_api::constants::SESSION_STATE_SEED_KEY).as_bytes(),
      &global_state.session_counter.to_le_bytes(),
    ],
    bump,

    payer = signer,
  )]
  pub session_state: Account<'info, states::SessionState>,

  #[account(mut)]
  signer: Signer<'info>,

  pub system_program: Program<'info, System>,
}

pub fn start_session(
  ctx: Context<StartSession>,
) -> Result<()> {
  let global_state = &mut ctx.accounts.global_state;
  let session_state = &mut ctx.accounts.session_state;

  session_state.created_at = Clock::get()?.unix_timestamp;
  session_state.updated_at = Clock::get()?.unix_timestamp;

  global_state.session_counter = global_state.session_counter.checked_add(1).unwrap();

  Ok(())
}
