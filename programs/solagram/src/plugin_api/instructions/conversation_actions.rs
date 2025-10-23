use anchor_lang::prelude::*;

use crate::{ plugin_api, utils, constants, errors };

#[derive(Accounts)]
#[instruction(params: plugin_api::states::RegisterPlatformConversationParams)]
pub struct RegisterConversation<'info> {
  #[account(
    init,

    space = utils::constants::ANCHOR_DISCRIMINATOR_SIZE + plugin_api::states::PlatformConversationState::INIT_SPACE,
    seeds = [
      String::from(plugin_api::constants::PLATFORM_CONVERSATION_STATE_SEED_KEY).as_bytes(),
      params.conversation.key().as_ref(),
    ],
    bump,

    payer = owner,
  )]
  pub platform_conversation_state: Account<'info, plugin_api::states::PlatformConversationState>,

  #[account(
    seeds = [String::from(plugin_api::constants::COMMUNICATION_PLUGIN_LIST_STATE_SEED_KEY).as_bytes()],
    bump,
  )]
  pub communication_plugin_list_state: Account<'info, utils::pubkeys::PubkeyList>,

  #[account(
    mut,

    seeds = [
      String::from(constants::PROFILE_COMMUNICATION_LIST_STATE_SEED_KEY).as_bytes(),
      owner.key().as_ref(),
    ],
    bump,

    realloc = utils::pubkeys::PubkeyList::space_for(
      profile_communication_list_state.pubkeys.len() + 1,
      constants::MAX_PROFILE_COMMUNICATION_LIST_LENGTH,
    ).unwrap(),
    realloc::payer = owner,
    realloc::zero = false,
  )]
  pub profile_communication_list_state: Account<'info, utils::pubkeys::PubkeyList>,

  #[account(mut)]
  pub owner: Signer<'info>,
  pub system_program: Program<'info, System>,
}

pub fn register_conversation(
  ctx: Context<RegisterConversation>,
  params: plugin_api::states::RegisterPlatformConversationParams,
) -> Result<()> {
  let platform_conversation_state = &mut ctx.accounts.platform_conversation_state;
  let communication_plugin_list_state = &mut ctx.accounts.communication_plugin_list_state;
  let profile_communication_list_state = &mut ctx.accounts.profile_communication_list_state;

  platform_conversation_state.owner = ctx.accounts.owner.key();

  require!(
    communication_plugin_list_state.pubkeys.contains(&params.conversation_plugin),
    errors::SolagramError::PluginNotFound,
  );

  platform_conversation_state.conversation_plugin = params.conversation_plugin;

  require!(
    utils::PdaValidator::is_valid(
      &params.conversation,
      &params.conversation_plugin,
      &[
        String::from(plugin_api::constants::CONVERSATION_STATE_SEED_KEY).as_bytes(),
        &params.unique_conversation_number.to_le_bytes(),
      ],
    ),
    utils::errors::UtilsError::PDAMalformed,
  );

  platform_conversation_state.conversation = params.conversation;

  require!(
    !profile_communication_list_state.pubkeys.contains(&platform_conversation_state.key()),
    errors::SolagramError::ProfileAlreadyParticipant,
  );

  require!(
    profile_communication_list_state.pubkeys.len() < constants::MAX_PROFILE_COMMUNICATION_LIST_LENGTH,
    errors::SolagramError::ProfileConversationsLimitExceeded,
  );

  profile_communication_list_state.pubkeys.push(platform_conversation_state.key());
  
  Ok(())
}

#[derive(Accounts)]
#[instruction(params: plugin_api::states::AddPlatformConversationParticipantParams)]
pub struct AddConversationParticipant<'info> {
  #[account(
    address = params.platform_conversation,

    constraint = signer.key().as_ref() == platform_conversation_state.owner.key().as_ref()
      @ errors::SolagramError::Unauthorized,
  )]
  pub platform_conversation_state: Account<'info, plugin_api::states::PlatformConversationState>,

  #[account(
    mut,

    seeds = [
      String::from(constants::PROFILE_COMMUNICATION_LIST_STATE_SEED_KEY).as_bytes(),
      params.profile.key().as_ref(),
    ],
    bump,

    realloc = utils::pubkeys::PubkeyList::space_for(
      profile_communication_list_state.pubkeys.len() + 1,
      constants::MAX_PROFILE_COMMUNICATION_LIST_LENGTH,
    ).unwrap(),
    realloc::payer = signer,
    realloc::zero = false,
  )]
  pub profile_communication_list_state: Account<'info, utils::pubkeys::PubkeyList>,

  #[account(mut)]
  pub signer: Signer<'info>,
  pub system_program: Program<'info, System>,
}

pub fn add_conversation_participant(
  ctx: Context<AddConversationParticipant>,
  params: plugin_api::states::AddPlatformConversationParticipantParams,
) -> Result<()> {
  let profile_communication_list_state = &mut ctx.accounts.profile_communication_list_state;

  require!(
    !profile_communication_list_state.pubkeys.contains(&params.platform_conversation),
    errors::SolagramError::ProfileAlreadyParticipant,
  );

  require!(
    profile_communication_list_state.pubkeys.len() < constants::MAX_PROFILE_COMMUNICATION_LIST_LENGTH,
    errors::SolagramError::ProfileConversationsLimitExceeded,
  );

  profile_communication_list_state.pubkeys.push(params.platform_conversation);

  Ok(())
}
