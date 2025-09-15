use anchor_lang::prelude::*;

#[account]
#[derive(Default, InitSpace)]
pub struct GlobalState {
  pub admin: Pubkey,

  pub profile_counter: u64,
}
