use anchor_lang::prelude::*;

use crate::platform::{ states };
use crate::{ utils, constants, errors };

#[derive(Accounts)]
pub struct CreateProfile<'info> {
  #[account(
    init,

    payer = signer,

    space = utils::constants::ANCHOR_DISCRIMINATOR_SIZE + states::ProfileState::INIT_SPACE,
    seeds = [
      String::from(constants::PROFILE_STATE_SEED_KEY).as_bytes(),
      signer.key().as_ref(),
    ],
    bump,
  )]
  pub profile_state: Account<'info, states::ProfileState>,

  #[account(
    init,
    payer = signer,
    space = utils::pubkeys::PubkeyList::space_for(0, constants::MAX_PROFILE_COMMUNICATION_LIST_LENGTH).unwrap(),
    seeds = [
      String::from(constants::PROFILE_COMMUNICATION_LIST_STATE_SEED_KEY).as_bytes(),
      signer.key().as_ref(),
    ],
    bump,
  )]
  pub profile_communication_list_state: Account<'info, utils::pubkeys::PubkeyList>,
  
  #[account(
    mut,
    seeds = [String::from(constants::GLOBAL_STATE_SEED_KEY).as_bytes()],
    bump,
  )]
  pub global_state: Account<'info, states::GlobalState>,

  #[account(mut)]
  pub signer: Signer<'info>,
  pub system_program: Program<'info, System>,
}

pub fn create_profile(
  ctx: Context<CreateProfile>,
  name: String,
) -> Result<()> {
  require!(name.len() <= constants::MAX_PROFILE_NAME_LENGTH, errors::SolagramError::ProfileNameTooLong);
  
  let profile_state = &mut ctx.accounts.profile_state;
  profile_state.authority = ctx.accounts.signer.key();
  profile_state.name = name;

  profile_state.created_at = Clock::get()?.unix_timestamp;
  profile_state.updated_at = Clock::get()?.unix_timestamp;

  let profile_communication_list_state = &mut ctx.accounts.profile_communication_list_state;

  profile_communication_list_state.pubkeys = Vec::new();
  profile_communication_list_state.bump = ctx.bumps.profile_communication_list_state;

  let global_state = &mut ctx.accounts.global_state;
  global_state.profile_counter = global_state.profile_counter.checked_add(1).unwrap();
  
  Ok(())
}
