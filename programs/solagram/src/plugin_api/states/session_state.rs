use anchor_lang::prelude::*;

#[account]
#[derive(Default, InitSpace)]
pub struct PlatformSessionState {
  pub application_plugin: Pubkey,
  pub inner_session: Pubkey,

  pub recipient: Option<Pubkey>,

  pub interest: Interest,

  pub initiatior_address: Pubkey,
}

#[derive(InitSpace, AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct Interest {
  pub token_plugin: Pubkey,
  pub share: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct RegisterPlatformSessionParams {
  pub application_plugin: Pubkey,
  pub inner_session: Pubkey,

  pub participants: Vec<Pubkey>,

  pub interest: Interest,

  pub unique_session_number: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct SignPlatformSessionParams {
  pub inner_session: Pubkey,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct AbortPlatformSessionParams {
  pub inner_session: Pubkey,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct ClosePlatformSessionParams {
  pub inner_session: Pubkey,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct SetRecipientParams {
  pub inner_session: Pubkey,

  pub recipient: Option<Pubkey>,
}
