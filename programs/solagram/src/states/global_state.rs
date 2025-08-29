use anchor_lang::prelude::*;

#[account]
#[derive(Default, InitSpace)]

pub struct GlobalState {
  pub admin: Pubkey,
  pub profile_counter: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct InitializeGlobalStateParams {
  pub admin: Pubkey,
}
