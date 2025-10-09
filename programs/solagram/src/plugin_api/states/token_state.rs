use anchor_lang::prelude::*;

#[account]
#[derive(Default, InitSpace)]
pub struct PlatformTokenState {
  pub mint_address: Pubkey,
  pub airdrop_amount: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct SetPlatformTokenParams {
  pub airdrop_amount: u64,
}
