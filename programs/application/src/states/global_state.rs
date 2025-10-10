use anchor_lang::prelude::*;

use crate::constants::{ APPLICATION_NAME_MAX_LENGTH, APPLICATION_DESCRIPTION_MAX_LENGTH };

#[account]
#[derive(Default, InitSpace)]
pub struct GlobalState {
  pub platform: Pubkey,

  #[max_len(APPLICATION_NAME_MAX_LENGTH)]
  pub name: String,
  #[max_len(APPLICATION_DESCRIPTION_MAX_LENGTH)]
  pub description: String,

  pub session_counter: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct InitalizeGlobalStateParams {
  pub platform: Pubkey,
}
