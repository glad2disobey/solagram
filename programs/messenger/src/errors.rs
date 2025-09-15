use anchor_lang::prelude::*;

#[error_code]
pub enum MessengerError {
  #[msg("Conversation title too long")]
  ConversationTitleTooLong,

  #[msg("Message too long")]
  MessageTooLong,
}
