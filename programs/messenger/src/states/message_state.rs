use anchor_lang::prelude::*;

use crate::constants::{ MESSAGE_MAX_LENGTH };

#[account]
#[derive(Default, InitSpace)]
pub struct MessageState {
  pub authority: Pubkey,

  #[max_len(MESSAGE_MAX_LENGTH)]
  pub message_text: String,

  pub previous_message: Pubkey,

  pub created_at: i64,
  pub updated_at: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct AddMessageParams {
  pub platform_conversation: Pubkey,

  pub message_text: String,
}
