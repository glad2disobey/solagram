use anchor_lang::prelude::*;

use crate::constants::{ CONVERSATION_TITLE_MAX_LENGTH };

#[account]
#[derive(Default, InitSpace)]
pub struct ConversationState {
  pub owner: Pubkey,

  #[max_len(CONVERSATION_TITLE_MAX_LENGTH)]
  pub title: String,

  pub message: Pubkey,

  pub created_at: i64,
  pub updated_at: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct OpenConversationParams {
  pub title: String,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct AddParticipantParams {
  pub platform_conversation: Pubkey,

  pub participant: Pubkey,
}
