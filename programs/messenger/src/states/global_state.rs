use anchor_lang::prelude::*;

use crate::constants::{ MESSENGER_NAME_MAX_LENGTH, MESSENGER_DESCRIPTION_MAX_LENGTH };

#[account]
#[derive(Default, InitSpace)]
pub struct GlobalState {
  pub admin: Pubkey,

  pub platform: Pubkey,

  #[max_len(MESSENGER_NAME_MAX_LENGTH)]
  pub name: String,
  #[max_len(MESSENGER_DESCRIPTION_MAX_LENGTH)]
  pub description: String,

  pub conversation_counter: u64,
  pub message_counter: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct InitalizeGlobalStateParams {
  pub platform: Pubkey,
}
