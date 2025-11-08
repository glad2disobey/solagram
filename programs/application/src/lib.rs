#![allow(unexpected_cfgs)]

use anchor_lang::prelude::*;

pub mod conditions;

pub mod constants;
pub mod errors;

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
    instructions::initialize_global_state(ctx, params)
  }

  pub fn start_session(
    ctx: Context<StartSession>,
  ) -> Result<()> {
    instructions::start_session(ctx)
  }

  pub fn make_move<'info>(
    ctx: Context<'_, '_, '_, 'info, MakeMove<'info>>,
    params: states::MakeMoveParams,
  )-> Result<()> {
    instructions::make_move(ctx, params)
  }

  pub fn resign<'info>(
    ctx: Context<'_, '_, '_, 'info, Resign<'info>>,
    params: states::ResignParams,
  )-> Result<()> {
    instructions::resign(ctx, params)
  }
}
