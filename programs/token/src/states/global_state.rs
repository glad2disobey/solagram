use anchor_lang::prelude::*;

#[account]
#[derive(Default, InitSpace)]
pub struct GlobalState {
  pub mint: Pubkey,
}
