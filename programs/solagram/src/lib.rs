#![allow(unexpected_cfgs)]

pub mod instructions;
pub mod state;

pub mod constants;
pub mod errors;

use anchor_lang::prelude::*;
use instructions::*;

declare_id!("7W7K9yAshEJBgPRNPW1fDiXuVDzjKBPcBWCC6UGrWxKC");

#[program]
pub mod solagram {
  use super::*;

  pub fn initialize_global_state(
    ctx: Context<InitializeGlobalState>,
    params: state::GlobalStateParams,
  ) -> Result<()> {
    instructions::initialize::initialize_global_state(ctx, params)
  }

  pub fn create_profile(
    ctx: Context<CreateProfile>,
    name: String,
  ) -> Result<()> {
    instructions::profile_actions::create_profile(ctx, name)
  }
}
