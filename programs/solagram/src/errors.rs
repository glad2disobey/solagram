use anchor_lang::prelude::*;

#[error_code]
pub enum SolagramError {
  #[msg("Unauthorized access")]
  Unauthorized,

  #[msg("Profile name too long")]
  ProfileNameTooLong,
  #[msg("Profile is already participant of this conversation")]
  ProfileAlreadyParticipant,
  #[msg("Unable to add participant to conversation, limit exceeded")]
  ProfileConversationsLimitExceeded,

  #[msg("Insufficient funds")]
  InsufficientFunds,

  #[msg("Plugin is already installed")]
  PluginAlreadyInstalled,
  #[msg("Plugin not found")]
  PluginNotFound,
  #[msg("Unable to install plugin, limit exceeded")]
  PluginLimitExceeded,
  #[msg("Plugin type is not supported")]
  PluginUnsupported,

  #[msg("Create token account params malformed")]
  CreateTokenAccountParamsMalformed,
}
