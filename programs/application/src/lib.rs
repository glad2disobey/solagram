#![allow(unexpected_cfgs)]

use anchor_lang::prelude::*;

pub mod constants;

pub mod instructions;
pub mod states;

use instructions::*;
use states::*;

declare_id!("5BMcPrhViYHQ9fgPofiPGNE1aawt8g8Jb8txrBRGAFu2");

#[program]
pub mod application {
  use super::*;

  pub fn initialize(
    ctx: Context<InitializeGlobalState>,
    params: InitalizeGlobalStateParams,
  ) -> Result<()> {
    initialize_global_state(ctx, params)
  }
}
