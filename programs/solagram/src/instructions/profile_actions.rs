use anchor_lang::prelude::*;

use crate::{ state::{ Profile, GlobalState } };

use crate::{ errors, constants };

#[derive(Accounts)]
pub struct CreateProfile<'info> {
  #[account(
      init,
      payer = signer,
      space = 8 + Profile::INIT_SPACE,
      seeds = [b"profile", signer.key().as_ref()],
      bump,
  )]
  pub profile: Account<'info, Profile>,
  
  #[account(
      seeds = [b"global_state"],
      bump,
  )]
  pub global_state: Account<'info, GlobalState>,

  #[account(mut)]
  pub signer: Signer<'info>,
  pub system_program: Program<'info, System>,
}

pub fn create_profile(
  ctx: Context<CreateProfile>,
  name: String,
) -> Result<()> {
  require!(name.len() <= constants::MAX_PROFILE_NAME_LENGTH, errors::ProgramError::ProfileNameTooLong);
  
  let profile = &mut ctx.accounts.profile;
  profile.authority = ctx.accounts.signer.key();
  profile.name = name;

  profile.created_at = Clock::get()?.unix_timestamp;
  profile.updated_at = Clock::get()?.unix_timestamp;

  let global_state = &mut ctx.accounts.global_state;
  global_state.profile_counter = global_state.profile_counter.checked_add(1).unwrap();
  
  Ok(())
}
