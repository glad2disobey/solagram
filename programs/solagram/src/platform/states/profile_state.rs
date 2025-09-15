use anchor_lang::prelude::*;

use crate::constants::{ MAX_PROFILE_NAME_LENGTH };

#[account]
#[derive(Default, InitSpace)]
pub struct ProfileState {
  pub authority: Pubkey,

  #[max_len(MAX_PROFILE_NAME_LENGTH)]
  pub name: String,

  pub created_at: i64,
  pub updated_at: i64,
}
