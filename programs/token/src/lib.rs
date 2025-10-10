#![allow(unexpected_cfgs)]

use anchor_lang::prelude::*;

pub mod constants;

pub mod instructions;
pub mod states;

use instructions::*;

declare_id!("4kmeDwmjEiVaGHSD3CFgYukd3nSt4eNNBwJ2eEdb2sqK");

#[program]
pub mod token {
  use super::*;

  pub fn initialize(
    ctx: Context<Initialize>,
  ) -> Result<()> {
    instructions::initialize::initialize(ctx)
  }
}
