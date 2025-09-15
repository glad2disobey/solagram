use anchor_lang::prelude::*;

use crate::{ constants, errors, states };

use solagram::utils;

#[derive(Accounts)]
#[instruction(params: states::AddMessageParams)]
pub struct AddMessage<'info> {
  #[account(
    mut,
    seeds = [String::from(constants::GLOBAL_STATE_SEED_KEY).as_bytes()],
    bump,
  )]
  pub global_state: Account<'info, states::GlobalState>,

  #[account(
    init,
    payer = participant,
    space = utils::constants::ANCHOR_DISCRIMINATOR_SIZE + states::MessageState::INIT_SPACE,
    seeds = [
      String::from(constants::MESSAGE_STATE_SEED_KEY).as_bytes(),
      &global_state.message_counter.to_le_bytes(),
    ],
    bump,
  )]
  pub message_state: Account<'info, states::MessageState>,

  #[account(
    mut,
    address = platform_conversation_state.conversation.key(),
  )]
  pub conversation_state: Account<'info, states::ConversationState>,

  #[account(
    seeds = [
      String::from(solagram::constants::PROFILE_COMMUNICATION_LIST_STATE_SEED_KEY).as_bytes(),
      participant.key().as_ref(),
    ],
    bump,

    seeds::program = global_state.platform,

    constraint = platform_profile_communication_list_state.pubkeys.contains(&params.platform_conversation)
      @ solagram::errors::SolagramError::Unauthorized,
  )]
  pub platform_profile_communication_list_state: Account<'info, solagram::utils::PubkeyList>,

  #[account(
    address = params.platform_conversation.key(),
  )]
  pub platform_conversation_state: Account<'info, solagram::plugin_api::PlatformConversationState>,

  #[account(mut)]
  pub participant: Signer<'info>,
  pub system_program: Program<'info, System>,
}

pub fn add_message(
  ctx: Context<AddMessage>,
  params: states::AddMessageParams,
) -> Result<()> {
  let global_state = &mut ctx.accounts.global_state;
  let message_state = &mut ctx.accounts.message_state;
  let conversation_state = &mut ctx.accounts.conversation_state;

  let _platform_profile_communication_list_state = &mut ctx.accounts.platform_profile_communication_list_state;
  let _platform_conversation_state = &mut ctx.accounts.platform_conversation_state;

  global_state.message_counter = global_state.message_counter.checked_add(1).unwrap();

  require!(
    params.message_text.len() <= constants::MESSAGE_MAX_LENGTH,
    errors::MessengerError::MessageTooLong,
  );

  message_state.message_text = params.message_text;

  message_state.previous_message = conversation_state.message;
  conversation_state.message = message_state.key();

  message_state.authority = ctx.accounts.participant.key();
  
  Ok(())
}