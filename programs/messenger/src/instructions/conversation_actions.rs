use anchor_lang::prelude::*;

use crate::{ states, constants, errors };

use solagram;
use solagram::program::*;

#[derive(Accounts)]
#[instruction(params: states::OpenConversationParams)]
pub struct OpenConversation<'info> {
  #[account(
    mut,
    seeds = [String::from(constants::GLOBAL_STATE_SEED_KEY).as_bytes()],
    bump,
  )]
  pub global_state: Account<'info, states::GlobalState>,

  #[account(
    init,
    payer = owner,
    space = solagram::utils::constants::ANCHOR_DISCRIMINATOR_SIZE + states::ConversationState::INIT_SPACE,
    seeds = [
      String::from(solagram::plugin_api::constants::CONVERSATION_STATE_SEED_KEY).as_bytes(),
      &global_state.conversation_counter.to_le_bytes(),
    ],
    bump,
  )]
  pub conversation_state: Account<'info, states::ConversationState>,

  #[account(mut)]
  pub owner: Signer<'info>,

  pub solagram: Program<'info, Solagram>,
  pub system_program: Program<'info, System>,
}

pub fn open_conversation(
  ctx: Context<OpenConversation>,
  params: states::OpenConversationParams,
) -> Result<()> {
  let conversation_state = &mut ctx.accounts.conversation_state;
  let global_state = &mut ctx.accounts.global_state;

  conversation_state.owner = ctx.accounts.owner.key();

  require!(
    params.title.len() <= constants::CONVERSATION_TITLE_MAX_LENGTH,
    errors::MessengerError::ConversationTitleTooLong,
  );

  conversation_state.title = params.title;

  conversation_state.created_at = Clock::get()?.unix_timestamp;
  conversation_state.updated_at = Clock::get()?.unix_timestamp;

  global_state.conversation_counter = global_state.conversation_counter.checked_add(1).unwrap();

  Ok(())
}

#[derive(Accounts)]
#[instruction(params: states::AddParticipantParams)]
pub struct AddParticipant<'info> {
  #[account(
    address = platform_conversation_state.conversation.key(),

    constraint = signer.key().as_ref() == conversation_state.owner.key().as_ref()
      @ solagram::errors::SolagramError::Unauthorized,
  )]
  pub conversation_state: Account<'info, states::ConversationState>,

  #[account(
    seeds = [String::from(constants::GLOBAL_STATE_SEED_KEY).as_bytes()],
    bump,
  )]
  pub global_state: Account<'info, states::GlobalState>,

  #[account(
    address = params.platform_conversation.key(),
  )]
  pub platform_conversation_state: Account<'info, solagram::plugin_api::states::PlatformConversationState>,

  #[account(
    mut,
    seeds = [
      String::from(solagram::constants::PROFILE_COMMUNICATION_LIST_STATE_SEED_KEY).as_bytes(),
      params.participant.key().as_ref(),
    ],
    bump,

    seeds::program = global_state.platform,
  )]
  pub platform_profile_communication_list_state: Account<'info, solagram::utils::PubkeyList>,

  #[account(mut)]
  pub signer: Signer<'info>,

  pub solagram: Program<'info, Solagram>,
  pub system_program: Program<'info, System>,
}

pub fn add_participant(
  ctx: Context<AddParticipant>,
  params: states::AddParticipantParams,
) -> Result<()> {
  let conversation_state = &mut ctx.accounts.conversation_state;
  let _global_state = &mut ctx.accounts.global_state;

  let platform_conversation_state = &mut ctx.accounts.platform_conversation_state;
  let platform_profile_communication_list_state = &mut ctx.accounts.platform_profile_communication_list_state;

  conversation_state.updated_at = Clock::get()?.unix_timestamp;

  let cpi_accounts = solagram::cpi::accounts::AddConversationParticipant {
    platform_conversation_state: platform_conversation_state.to_account_info(),
    profile_communication_list_state: platform_profile_communication_list_state.to_account_info(),

    signer: ctx.accounts.signer.to_account_info(),
    system_program: ctx.accounts.system_program.to_account_info(),
  };

  let cpi_context = CpiContext::new(
    ctx.accounts.solagram.to_account_info(),
    cpi_accounts,
  );

  let cpi_params = solagram::plugin_api::states::AddPlatformConversationParticipantParams {
    platform_conversation: platform_conversation_state.key(),

    profile: params.participant,
  };

  solagram::cpi::add_conversation_participant(cpi_context, cpi_params)?;

  Ok(())
}
