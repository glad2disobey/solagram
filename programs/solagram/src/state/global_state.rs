use anchor_lang::prelude::*;

#[account]
#[derive(Default, InitSpace)]

pub struct GlobalState {
  pub admin: Pubkey,
  pub profile_counter: u64,

  // #[max_len(10)]
  // pub communication_plugins_list: Vec<Pubkey>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct GlobalStateParams {
  pub admin: Pubkey,
}
