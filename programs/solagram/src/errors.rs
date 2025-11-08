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
  #[msg("Extra funds found")]
  ExtraFundsFound,

  #[msg("Remaining accounts list is malformed")]
  RemainingAccountsListMalformed,

  #[msg("Plugin is already installed")]
  PluginAlreadyInstalled,
  #[msg("Plugin not found")]
  PluginNotFound,
  #[msg("Unable to install plugin, limit exceeded")]
  PluginLimitExceeded,
  #[msg("Plugin type is not supported")]
  PluginUnsupported,

  #[msg("Create token account params are malformed")]
  CreateTokenAccountParamsMalformed,

  #[msg("Set recipient params are malformed")]
  SetRecipientParamsMalformed,
  #[msg("Start application session params are malformed")]
  StartApplicationSessionParamsMalformed,
  #[msg("Session is already signed")]
  SessionAlreadySigned,
  #[msg("Session is not fully signed")]
  SessionNotFullySigned,
  #[msg("Session is not finished")]
  SessionNotFinished,
  #[msg("Invite participant params are malformed")]
  InviteParticipantParamsMalformed,
  #[msg("Profile aleready invited")]
  ProfileAlreadyInvited,
  #[msg("Purge profile sessions params are malformed")]
  PurgeProfileSessionsParamsMalformed,
}
