#![allow(unexpected_cfgs)]

use anchor_lang::prelude::*;

pub mod states;
pub mod instructions;

pub mod constants;
pub mod errors;

use instructions::*;

declare_id!("3m3V6iGoTzRAcw52mtpmbUEzqzqpm9XSvYrczsWjiMTx");

#[program]
pub mod messenger {
  use super::*;

  pub fn initialize(
    ctx: Context<InitializeGlobalState>,
    params: states::InitalizeGlobalStateParams,
  ) -> Result<()> {
    instructions::initialize::initialize_global_state(ctx, params)
  }

  pub fn open_conversation(
    ctx: Context<OpenConversation>,
    params: states::OpenConversationParams,
  ) -> Result<()> {
    instructions::conversation_actions::open_conversation(ctx, params)
  }

  pub fn add_participant(
    ctx: Context<AddParticipant>,
    params: states::AddParticipantParams,
  ) -> Result<()> {
    instructions::conversation_actions::add_participant(ctx, params)
  }

  pub fn add_message(
    ctx: Context<AddMessage>,
    params: states::AddMessageParams,
  ) -> Result<()> {
    instructions::message_actions::add_message(ctx, params)
  }
}
