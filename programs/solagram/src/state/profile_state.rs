use anchor_lang::prelude::*;

#[account]
#[derive(Default, InitSpace)]
pub struct Profile {
  pub authority: Pubkey,

  #[max_len(32)]
  pub name: String,

  pub created_at: i64,
  pub updated_at: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub enum ProfileAction {
    CreateProfile,
}
