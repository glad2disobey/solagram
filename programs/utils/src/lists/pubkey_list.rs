use anchor_lang::prelude::*;

use crate::{ constants::{ MAX_PUBKEY_LIST_COUNT }, errors };

#[account]
#[derive(Default, InitSpace)]
pub struct PubkeyList {
  #[max_len(MAX_PUBKEY_LIST_COUNT)]
  pub pubkeys: Vec<Pubkey>,
  pub bump: u8,
}

impl PubkeyList {
  pub const DISCRIMINATOR_LEN: usize = 8;
  pub const BUMP_LEN: usize = 1;
  pub const VEC_LEN: usize = 4;
  pub const VEC_CAPACITY: usize = 4;
  pub const PUBKEY_SIZE: usize = 32;

  pub fn space_for(num_pubkeys: usize, max_pubkeys: usize) -> Result<usize> {
    require!(
      num_pubkeys <= max_pubkeys,
      errors::UtilsError::PubkeyListLimitExceeded,
    );

    let size: usize = Self::DISCRIMINATOR_LEN
      + Self::BUMP_LEN
      + Self::VEC_LEN
      + Self::VEC_CAPACITY
      + (Self::PUBKEY_SIZE * num_pubkeys);

    Ok(size)
  }
}
