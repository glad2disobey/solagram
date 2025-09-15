use anchor_lang::prelude::*;

#[account]
#[derive(Default, InitSpace)]
pub struct PlatformConversationState {
  pub owner: Pubkey,
  
  pub conversation: Pubkey,
  pub conversation_plugin: Pubkey,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct InitPlatformConversationParams {
  pub conversation: Pubkey,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct RegisterPlatformConversationParams {
  pub conversation_plugin: Pubkey,

  pub conversation: Pubkey,

  // Should be unique for current conversation plugin
  pub unique_conversation_number: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct AddPlatformConversationParticipantParams {
  pub platform_conversation: Pubkey,

  pub profile: Pubkey,
}
