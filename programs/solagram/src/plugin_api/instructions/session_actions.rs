use anchor_lang::prelude::*;

use anchor_spl::{
  token_interface::{
    Mint, Token2022, TokenAccount,
    
    TransferChecked,
    transfer_checked,

    CloseAccount,
    close_account,

    HarvestWithheldTokensToMint,
    harvest_withheld_tokens_to_mint,
  },
};

use crate::{ constants, errors, plugin_api, utils };

#[derive(Accounts)]
#[instruction(params: plugin_api::states::RegisterPlatformSessionParams)]
pub struct RegisterPlatformSession<'info> {
  #[account(
    init,
    
    space = utils::constants::ANCHOR_DISCRIMINATOR_SIZE + plugin_api::states::PlatformSessionState::INIT_SPACE,
    seeds = [
      String::from(plugin_api::constants::PLATFORM_SESSION_STATE_SEED_KEY).as_bytes(),
      params.inner_session.key().as_ref(),
    ],
    bump,

    payer = signer,
  )]
  pub platform_session_state: Account<'info, plugin_api::states::PlatformSessionState>,

  #[account(
    seeds = [String::from(plugin_api::constants::APPLICATION_PLUGIN_LIST_STATE_SEED_KEY).as_bytes()],
    bump,

    constraint = application_plugin_list_state.pubkeys.contains(&params.application_plugin)
      @ errors::SolagramError::PluginNotFound,
  )]
  pub application_plugin_list_state: Account<'info, utils::pubkeys::PubkeyList>,

  #[account(
    seeds = [String::from(plugin_api::constants::TOKEN_PLUGIN_LIST_STATE_SEED_KEY).as_bytes()],
    bump,

    constraint = token_plugin_list_state.pubkeys.contains(&params.interest.token_plugin)
      @ errors::SolagramError::PluginNotFound,
  )]
  pub token_plugin_list_state: Account<'info, utils::pubkeys::PubkeyList>,

  #[account(
    init,

    space = utils::pubkeys::PubkeyList::space_for(
      params.participants.len(),
      plugin_api::constants::MAX_SESSION_PARTICIPANTS_COUNT,
    ).unwrap(),

    seeds = [
      String::from(plugin_api::constants::SESSION_PARTICIPANT_LIST_STATE_SEED_KEY).as_bytes(),
      platform_session_state.key().as_ref(),
    ],
    bump,

    payer = signer,
  )]
  pub session_participant_list_state: Account<'info, utils::pubkeys::PubkeyList>,

  #[account(
    init,

    space = utils::pubkeys::PubkeyList::space_for(
      params.participants.len(),
      plugin_api::constants::MAX_SESSION_PARTICIPANTS_COUNT,
    ).unwrap(),

    seeds = [
      String::from(plugin_api::constants::SESSION_SIGNER_LIST_STATE_SEED_KEY).as_bytes(),
      platform_session_state.key().as_ref(),
    ],
    bump,

    payer = signer,
  )]
  pub session_signer_list_state: Account<'info, utils::pubkeys::PubkeyList>,

  #[account(
    seeds = [
      String::from(plugin_api::constants::PLATFORM_TOKEN_STATE_SEED_KEY).as_bytes(),
      params.interest.token_plugin.as_ref(),
    ],
    bump,

    constraint = platform_token_state.mint_address == mint.to_account_info().key()
      @ errors::SolagramError::StartApplicationSessionParamsMalformed,
  )]
  pub platform_token_state: Account<'info, plugin_api::states::PlatformTokenState>,

  #[account(
    init,

    token::mint = mint,
    token::authority = session_treasury_state,
    token::token_program = token_program,

    seeds = [
      String::from(plugin_api::constants::SESSION_TREASURY_STATE_SEED_KEY).as_bytes(),
      platform_session_state.key().as_ref(),
    ],
    bump,

    payer = signer,
  )]
  pub session_treasury_state: InterfaceAccount<'info, TokenAccount>,

  pub mint: InterfaceAccount<'info, Mint>,

  #[account(mut)]
  pub signer: Signer<'info>,

  pub token_program: Program<'info, Token2022>,
  pub system_program: Program<'info, System>,
}

pub fn register_platform_session(
  ctx: Context<RegisterPlatformSession>,
  params: plugin_api::states::RegisterPlatformSessionParams,
) -> Result<()> {
  require!(
    utils::PdaValidator::is_valid(
      &params.inner_session,
      &params.application_plugin,
      &[
        String::from(plugin_api::constants::SESSION_STATE_SEED_KEY).as_bytes(),
        &params.unique_session_number.to_le_bytes(),
      ],
    ),
    utils::errors::UtilsError::PDAMalformed,
  );

  let platform_session_state = &mut ctx.accounts.platform_session_state;
  platform_session_state.inner_session = params.inner_session;
  platform_session_state.application_plugin = params.application_plugin;
  platform_session_state.interest = params.interest;
  platform_session_state.initiatior_address = ctx.accounts.signer.key();

  platform_session_state.is_fully_signed = false;
  platform_session_state.recipient = None;
  
  let session_participant_list_state = &mut ctx.accounts.session_participant_list_state;
  session_participant_list_state.pubkeys = params.participants;

  let session_signer_list_state = &mut ctx.accounts.session_signer_list_state;
  session_signer_list_state.pubkeys = Vec::new();

  Ok(())
}

#[derive(Accounts)]
#[instruction(params: plugin_api::states::InvitePlatformSessionParams)]
pub struct InvitePlatformSession<'info> {
  #[account(
    seeds = [
      String::from(plugin_api::constants::PLATFORM_SESSION_STATE_SEED_KEY).as_bytes(),
      params.inner_session.key().as_ref(),
    ],
    bump,

    constraint = platform_session_state.initiatior_address == signer.key()
      @ errors::SolagramError::Unauthorized,
  )]
  pub platform_session_state: Account<'info, plugin_api::states::PlatformSessionState>,

  #[account(
    seeds = [
      String::from(plugin_api::constants::SESSION_PARTICIPANT_LIST_STATE_SEED_KEY).as_bytes(),
      platform_session_state.key().as_ref(),
    ],
    bump,

    constraint = session_participant_list_state.pubkeys.contains(&params.participant.key())
      @ errors::SolagramError::InviteParticipantParamsMalformed,
  )]
  pub session_participant_list_state: Account<'info, utils::pubkeys::PubkeyList>,

  #[account(
    seeds = [
      String::from(plugin_api::constants::SESSION_SIGNER_LIST_STATE_SEED_KEY).as_bytes(),
      platform_session_state.key().as_ref(),
    ],
    bump,

    constraint = !session_signer_list_state.pubkeys.contains(&params.participant.key())
      @ errors::SolagramError::SessionAlreadySigned,
  )]
  pub session_signer_list_state: Account<'info, utils::pubkeys::PubkeyList>,

  #[account(
    seeds = [
      String::from(constants::PROFILE_SESSION_LIST_STATE_SEED_KEY).as_bytes(),
      params.participant.key().as_ref(),
    ],
    bump,

    constraint = !profile_session_list_state.pubkeys.contains(&platform_session_state.key())
      @ errors::SolagramError::SessionAlreadySigned,
  )]
  pub profile_session_list_state: Account<'info, utils::pubkeys::PubkeyList>,

  #[account(
    mut,

    seeds = [
      String::from(constants::PROFILE_PENDING_SESSION_LIST_STATE_SEED_KEY).as_bytes(),
      params.participant.key().as_ref(),
    ],
    bump,

    realloc = utils::pubkeys::PubkeyList::space_for(
      profile_pending_session_list_state.pubkeys.len() + 1,
      constants::MAX_PROFILE_PENDING_SESSION_LIST_LENGTH,
    ).unwrap(),
    realloc::payer = signer,
    realloc::zero = false,

    constraint = !profile_pending_session_list_state.pubkeys.contains(&platform_session_state.key())
      @ errors::SolagramError::ProfileAlreadyInvited,
  )]
  pub profile_pending_session_list_state: Account<'info, utils::pubkeys::PubkeyList>,

  #[account(mut)]
  pub signer: Signer<'info>,

  pub system_program: Program<'info, System>,
}

pub fn invite_platform_session(
  ctx: Context<InvitePlatformSession>,
  _params: plugin_api::states::InvitePlatformSessionParams,
) -> Result<()> {
  let profile_pending_session_list_state = &mut ctx.accounts.profile_pending_session_list_state;
  let platform_session_state = &mut ctx.accounts.platform_session_state;

  profile_pending_session_list_state.pubkeys.push(platform_session_state.key());

  Ok(())
}

#[derive(Accounts)]
#[instruction(params: plugin_api::states::SignPlatformSessionParams)]
pub struct SignPlatformSession<'info> {
  #[account(
    mut,

    seeds = [
      String::from(plugin_api::constants::PLATFORM_SESSION_STATE_SEED_KEY).as_bytes(),
      params.inner_session.key().as_ref(),
    ],
    bump,
  )]
  pub platform_session_state: Account<'info, plugin_api::states::PlatformSessionState>,

  #[account(
    seeds = [
      String::from(plugin_api::constants::SESSION_PARTICIPANT_LIST_STATE_SEED_KEY).as_bytes(),
      platform_session_state.key().as_ref(),
    ],
    bump,

    constraint = session_participant_list_state.pubkeys.contains(&signer.key())
      @ errors::SolagramError::Unauthorized,
  )]
  pub session_participant_list_state: Account<'info, utils::pubkeys::PubkeyList>,

  #[account(
    mut,

    seeds = [
      String::from(plugin_api::constants::SESSION_SIGNER_LIST_STATE_SEED_KEY).as_bytes(),
      platform_session_state.key().as_ref(),
    ],
    bump,

    constraint = !session_signer_list_state.pubkeys.contains(&signer.key())
      @ errors::SolagramError::SessionAlreadySigned,
  )]
  pub session_signer_list_state: Account<'info, utils::pubkeys::PubkeyList>,

  #[account(
    mut,

    seeds = [
      String::from(plugin_api::constants::SESSION_TREASURY_STATE_SEED_KEY).as_bytes(),
      platform_session_state.key().as_ref(),
    ],
    bump,
  )]
  pub session_treasury_state: InterfaceAccount<'info, TokenAccount>,

  #[account(
    mut,

    seeds = [
      String::from(plugin_api::constants::TOKEN_PROFILE_TREASURY_STATE_SEED_KEY).as_bytes(),
      platform_session_state.interest.token_plugin.key().as_ref(),
      signer.key().as_ref(),
    ],
    bump,

    constraint = token_profile_treasury_state.amount >= platform_session_state.interest.share
      @ errors::SolagramError::InsufficientFunds,
  )]
  pub token_profile_treasury_state: InterfaceAccount<'info, TokenAccount>,

  #[account(
    mut,

    seeds = [
      String::from(constants::PROFILE_SESSION_LIST_STATE_SEED_KEY).as_bytes(),
      signer.key().as_ref(),
    ],
    bump,

    realloc = utils::pubkeys::PubkeyList::space_for(
      profile_session_list_state.pubkeys.len() + 1,
      constants::MAX_PROFILE_SESSION_LIST_LENGTH,
    ).unwrap(),
    realloc::payer = signer,
    realloc::zero = false,

    constraint = !profile_session_list_state.pubkeys.contains(&platform_session_state.key())
      @ errors::SolagramError::SessionAlreadySigned,
  )]
  pub profile_session_list_state: Account<'info, utils::pubkeys::PubkeyList>,

  #[account(
    mut,

    seeds = [
      String::from(constants::PROFILE_PENDING_SESSION_LIST_STATE_SEED_KEY).as_bytes(),
      signer.key().as_ref(),
    ],
    bump,

    realloc = utils::pubkeys::PubkeyList::space_for(
      profile_pending_session_list_state.pubkeys.len() - 1,
      constants::MAX_PROFILE_PENDING_SESSION_LIST_LENGTH,
    ).unwrap(),
    realloc::payer = signer,
    realloc::zero = false,

    constraint = profile_pending_session_list_state.pubkeys.contains(&platform_session_state.key())
      @ errors::SolagramError::Unauthorized,
  )]
  pub profile_pending_session_list_state: Account<'info, utils::pubkeys::PubkeyList>,

  pub mint: InterfaceAccount<'info, Mint>,

  #[account(mut)]
  pub signer: Signer<'info>,

  pub token_program: Program<'info, Token2022>,
  pub system_program: Program<'info, System>,
}

pub fn sign_platform_session(
  ctx: Context<SignPlatformSession>,
  _params: plugin_api::states::SignPlatformSessionParams,
) -> Result<()> {
  let mint = &mut ctx.accounts.mint;

  let session_treasury_state = &mut ctx.accounts.session_treasury_state;
  let token_profile_treasury_state = &mut ctx.accounts.token_profile_treasury_state;
  let platform_session_state = &mut ctx.accounts.platform_session_state;

  let token_profile_treasury_state_seed_key =
    String::from(plugin_api::constants::TOKEN_PROFILE_TREASURY_STATE_SEED_KEY);

  let token_plugin_key = platform_session_state.interest.token_plugin.key();
  let signer_key = ctx.accounts.signer.key();

  let seeds: &[&[u8]] = &[
    token_profile_treasury_state_seed_key.as_bytes(),
    token_plugin_key.as_ref(),
    signer_key.as_ref(),
    &[ctx.bumps.token_profile_treasury_state],
  ];

  let signer_seeds = &[&seeds[..]];

  transfer_checked(
    CpiContext::new(
      ctx.accounts.token_program.to_account_info(),
      TransferChecked {
        mint: mint.to_account_info(),
        from: token_profile_treasury_state.to_account_info(),
        to: session_treasury_state.to_account_info(),
        authority: token_profile_treasury_state.to_account_info(),
      },
    ).with_signer(signer_seeds),
    platform_session_state.interest.share, mint.decimals,
  )?;

  let session_signer_list_state = &mut ctx.accounts.session_signer_list_state;

  session_signer_list_state.pubkeys.push(ctx.accounts.signer.key());

  let session_participant_list_state = &mut ctx.accounts.session_participant_list_state;

  let mut signer_list = session_signer_list_state.pubkeys.clone();
  let mut participant_list = session_participant_list_state.pubkeys.clone();

  signer_list.sort();
  participant_list.sort();

  platform_session_state.is_fully_signed = signer_list == participant_list;

  let profile_session_list_state = &mut ctx.accounts.profile_session_list_state;
  profile_session_list_state.pubkeys.push(platform_session_state.key());

  let profile_pending_session_list_state = &mut ctx.accounts.profile_pending_session_list_state;

  let profile_pending_session_index = profile_pending_session_list_state.pubkeys.iter()
    .position(|x| x == &platform_session_state.key()).unwrap();

  profile_pending_session_list_state.pubkeys.remove(profile_pending_session_index);

  Ok(())
}

#[derive(Accounts)]
#[instruction(params: plugin_api::states::AbortPlatformSessionParams)]
pub struct AbortPlatformSession<'info> {
  #[account(
    mut,

    seeds = [
      String::from(plugin_api::constants::PLATFORM_SESSION_STATE_SEED_KEY).as_bytes(),
      params.inner_session.key().as_ref(),
    ],
    bump,

    close = initiator,
  )]
  pub platform_session_state: Account<'info, plugin_api::states::PlatformSessionState>,

  #[account(
    mut,

    seeds = [
      String::from(plugin_api::constants::SESSION_PARTICIPANT_LIST_STATE_SEED_KEY).as_bytes(),
      platform_session_state.key().as_ref(),
    ],
    bump,

    constraint = session_participant_list_state.pubkeys.contains(&signer.key())
      @ errors::SolagramError::Unauthorized,

    close = initiator,
  )]
  pub session_participant_list_state: Account<'info, utils::pubkeys::PubkeyList>,

  #[account(
    mut,

    seeds = [
      String::from(plugin_api::constants::SESSION_SIGNER_LIST_STATE_SEED_KEY).as_bytes(),
      platform_session_state.key().as_ref(),
    ],
    bump,

    constraint = !session_signer_list_state.pubkeys.contains(&signer.key())
      @ errors::SolagramError::SessionAlreadySigned,

    close = initiator,
  )]
  pub session_signer_list_state: Account<'info, utils::pubkeys::PubkeyList>,

  #[account(
    mut,

    seeds = [
      String::from(plugin_api::constants::SESSION_TREASURY_STATE_SEED_KEY).as_bytes(),
      platform_session_state.key().as_ref(),
    ],
    bump,
  )]
  pub session_treasury_state: InterfaceAccount<'info, TokenAccount>,

  #[account(
    mut,

    seeds = [
      String::from(plugin_api::constants::PLATFORM_TOKEN_TREASURY_STATE_SEED_KEY).as_bytes(),
      platform_session_state.interest.token_plugin.key().as_ref(),
    ],
    bump,
  )]
  pub platform_token_treasury_state: InterfaceAccount<'info, TokenAccount>,

  #[account(
    mut,

    address = platform_session_state.initiatior_address,
  )]
  /// CHECK: manualy checked
  pub initiator: AccountInfo<'info>,

  #[account(
    mut,

    seeds = [
      String::from(constants::PROFILE_PENDING_SESSION_LIST_STATE_SEED_KEY).as_bytes(),
      signer.key().as_ref(),
    ],
    bump,

    realloc = utils::pubkeys::PubkeyList::space_for(
      profile_pending_session_list_state.pubkeys.len() - 1,
      constants::MAX_PROFILE_PENDING_SESSION_LIST_LENGTH,
    ).unwrap(),
    realloc::payer = signer,
    realloc::zero = false,

    constraint = profile_pending_session_list_state.pubkeys.contains(&platform_session_state.key())
      @ errors::SolagramError::Unauthorized,
  )]
  pub profile_pending_session_list_state: Account<'info, utils::pubkeys::PubkeyList>,

  #[account(mut)]
  pub mint: InterfaceAccount<'info, Mint>,

  #[account(mut)]
  pub signer: Signer<'info>,

  pub token_program: Program<'info, Token2022>,
  pub system_program: Program<'info, System>,
}

pub fn abort_platform_session<'info>(
  ctx: Context<'_, '_, '_, 'info, AbortPlatformSession<'info>>,
  _params: plugin_api::states::AbortPlatformSessionParams,
) -> Result<()> {
  let mint = &mut ctx.accounts.mint;

  let platform_session_state = &mut ctx.accounts.platform_session_state;
  let session_signer_list_state = &mut ctx.accounts.session_signer_list_state;
  let session_treasury_state = &mut ctx.accounts.session_treasury_state;

  let session_treasury_state_seed_key = String::from(plugin_api::constants::SESSION_TREASURY_STATE_SEED_KEY);
  let platform_session_state_key = platform_session_state.key();

  let seeds: &[&[u8]] = &[
    session_treasury_state_seed_key.as_bytes(),
    platform_session_state_key.as_ref(),
    &[ctx.bumps.session_treasury_state],
  ];

  let signer_seeds = &[&seeds[..]];

  if session_signer_list_state.pubkeys.len() > 0 {
    let signers_count: u64 = session_signer_list_state.pubkeys.len() as u64;
    let share = session_treasury_state.amount / signers_count;

    let session_signer_list = session_signer_list_state.pubkeys.clone();

    for recipient in session_signer_list {
      let (token_profile_treasury_state, _) = Pubkey::find_program_address(
        &[
          String::from(plugin_api::constants::TOKEN_PROFILE_TREASURY_STATE_SEED_KEY).as_bytes(),
          platform_session_state.interest.token_plugin.key().as_ref(),
          recipient.key().as_ref(),
        ],
        ctx.program_id,
      );

      let recipient_account_wrapper =
        ctx.remaining_accounts.iter().find(|x| x.key() == token_profile_treasury_state.key());

      require!(
        recipient_account_wrapper.is_some(),
        errors::SolagramError::RemainingAccountsListMalformed,
      );

      let recipient_account = recipient_account_wrapper.unwrap();

      transfer_checked(
        CpiContext::new(
          ctx.accounts.token_program.to_account_info(),
          TransferChecked {
            mint: mint.to_account_info(),
            from: session_treasury_state.to_account_info(),
            to: recipient_account.to_account_info(),
            authority: session_treasury_state.to_account_info(),
          },
        ).with_signer(signer_seeds),
        share, mint.decimals,
      )?;
    }
  }

  session_treasury_state.reload()?;

  transfer_checked(
    CpiContext::new(
      ctx.accounts.token_program.to_account_info(),
      TransferChecked {
        mint: mint.to_account_info(),
        from: session_treasury_state.to_account_info(),
        to: ctx.accounts.platform_token_treasury_state.to_account_info(),
        authority: session_treasury_state.to_account_info(),
      },
    ).with_signer(signer_seeds),
    session_treasury_state.amount, mint.decimals,
  )?;

  if platform_session_state.interest.transfer_fee_flag == true {
    harvest_withheld_tokens_to_mint(CpiContext::new(
      ctx.accounts.token_program.to_account_info(),
      HarvestWithheldTokensToMint {
        token_program_id: ctx.accounts.token_program.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
      }
    ), [session_treasury_state.to_account_info()].to_vec())?;
  }

  close_account(
    CpiContext::new(
      ctx.accounts.token_program.to_account_info(),
      CloseAccount {
        account: session_treasury_state.to_account_info(),
        destination: ctx.accounts.platform_token_treasury_state.to_account_info(),
        authority: session_treasury_state.to_account_info(),
      },
    ).with_signer(signer_seeds),
  )?;

  let profile_pending_session_list_state = &mut ctx.accounts.profile_pending_session_list_state;

  let profile_pending_session_index = profile_pending_session_list_state.pubkeys.iter()
    .position(|x| x == &platform_session_state.key()).unwrap();

  profile_pending_session_list_state.pubkeys.remove(profile_pending_session_index);

  Ok(())
}

#[derive(Accounts)]
#[instruction(params: plugin_api::states::SetRecipientParams)]
pub struct SetRecipient<'info> {
  #[account(
    mut,

    seeds = [
      String::from(plugin_api::constants::PLATFORM_SESSION_STATE_SEED_KEY).as_bytes(),
      params.inner_session.key().as_ref(),
    ],
    bump,

    constraint = platform_session_state.is_fully_signed == true
      @ errors::SolagramError::SessionNotFullySigned,
  )]
  pub platform_session_state: Account<'info, plugin_api::states::PlatformSessionState>,

  #[account(
    seeds = [
      String::from(plugin_api::constants::SESSION_PARTICIPANT_LIST_STATE_SEED_KEY).as_bytes(),
      platform_session_state.key().as_ref(),
    ],
    bump,
  )]
  pub session_participant_list_state: Account<'info, utils::pubkeys::PubkeyList>,

  #[account(
    seeds = [
      String::from(plugin_api::constants::SESSION_SIGNER_LIST_STATE_SEED_KEY).as_bytes(),
      platform_session_state.key().as_ref(),
    ],
    bump,

    constraint = params.recipient.is_none() || session_signer_list_state.pubkeys.contains(&params.recipient.unwrap())
      @ errors::SolagramError::SetRecipientParamsMalformed,
  )]
  pub session_signer_list_state: Account<'info, utils::pubkeys::PubkeyList>,

  #[account(mut)]
  pub pda_signer: Signer<'info>,

  pub system_program: Program<'info, System>,
}

pub fn set_recipient<'info>(
  ctx: Context<SetRecipient>,
  params: plugin_api::states::SetRecipientParams,
) -> Result<()> {
  let platform_session_state = &mut ctx.accounts.platform_session_state;

  require!(
    utils::PdaValidator::is_valid(
      &ctx.accounts.pda_signer.key(),
      &platform_session_state.application_plugin,
      &[String::from(plugin_api::constants::SIGNER_SEED_KEY).as_bytes()],
    ),
    errors::SolagramError::Unauthorized,
  );

  platform_session_state.recipient = params.recipient;

  Ok(())
}

#[derive(Accounts)]
#[instruction(params: plugin_api::states::ClosePlatformSessionParams)]
pub struct ClosePlatformSession<'info> {
  #[account(
    mut,

    seeds = [
      String::from(plugin_api::constants::PLATFORM_SESSION_STATE_SEED_KEY).as_bytes(),
      params.inner_session.key().as_ref(),
    ],
    bump,

    constraint = platform_session_state.is_fully_signed
      @errors::SolagramError::SessionNotFullySigned,

    close = initiator,
  )]
  pub platform_session_state: Account<'info, plugin_api::states::PlatformSessionState>,

  #[account(
    mut,

    seeds = [
      String::from(plugin_api::constants::SESSION_PARTICIPANT_LIST_STATE_SEED_KEY).as_bytes(),
      platform_session_state.key().as_ref(),
    ],
    bump,

    close = initiator,
  )]
  pub session_participant_list_state: Account<'info, utils::pubkeys::PubkeyList>,

  #[account(
    mut,

    seeds = [
      String::from(plugin_api::constants::SESSION_SIGNER_LIST_STATE_SEED_KEY).as_bytes(),
      platform_session_state.key().as_ref(),
    ],
    bump,

    close = initiator,
  )]
  pub session_signer_list_state: Account<'info, utils::pubkeys::PubkeyList>,

  #[account(
    mut,

    seeds = [
      String::from(plugin_api::constants::SESSION_TREASURY_STATE_SEED_KEY).as_bytes(),
      platform_session_state.key().as_ref(),
    ],
    bump,
  )]
  pub session_treasury_state: InterfaceAccount<'info, TokenAccount>,

  #[account(
    mut,

    seeds = [
      String::from(plugin_api::constants::PLATFORM_TOKEN_TREASURY_STATE_SEED_KEY).as_bytes(),
      platform_session_state.interest.token_plugin.key().as_ref(),
    ],
    bump,
  )]
  pub platform_token_treasury_state: InterfaceAccount<'info, TokenAccount>,

  #[account(
    mut,

    address = platform_session_state.initiatior_address,
  )]
  /// CHECK: manualy checked
  pub initiator: AccountInfo<'info>,

  #[account(mut)]
  pub mint: InterfaceAccount<'info, Mint>,

  #[account(mut)]
  pub pda_signer: Signer<'info>,

  pub token_program: Program<'info, Token2022>,
  pub system_program: Program<'info, System>,
}

pub fn close_platform_session<'info>(
  ctx: Context<'_, '_, '_, 'info, ClosePlatformSession<'info>>,
  _params: plugin_api::states::ClosePlatformSessionParams,
) -> Result<()> {
  let mint = &mut ctx.accounts.mint;

  let platform_session_state = &mut ctx.accounts.platform_session_state;
  let session_signer_list_state = &mut ctx.accounts.session_signer_list_state;
  let session_treasury_state = &mut ctx.accounts.session_treasury_state;

  let session_treasury_state_seed_key = String::from(plugin_api::constants::SESSION_TREASURY_STATE_SEED_KEY);
  let platform_session_state_key = platform_session_state.key();

  require!(
    utils::PdaValidator::is_valid(
      &ctx.accounts.pda_signer.key(),
      &platform_session_state.application_plugin,
      &[String::from(plugin_api::constants::SIGNER_SEED_KEY).as_bytes()],
    ),
    errors::SolagramError::Unauthorized,
  );

  let seeds: &[&[u8]] = &[
    session_treasury_state_seed_key.as_bytes(),
    platform_session_state_key.as_ref(),
    &[ctx.bumps.session_treasury_state],
  ];

  let signer_seeds = &[&seeds[..]];

  if platform_session_state.recipient.is_some() {
    let token_profile_treasury_state_key = String::from(plugin_api::constants::TOKEN_PROFILE_TREASURY_STATE_SEED_KEY);
    let token_plugin_key = platform_session_state.interest.token_plugin.key();
    let recipient_key = platform_session_state.recipient.unwrap().key();

    let profile_treasury_seeds = &[
      token_profile_treasury_state_key.as_bytes(),
      token_plugin_key.as_ref(),
      recipient_key.as_ref(),
    ];

    let (profile_treasury, _) = Pubkey::find_program_address(profile_treasury_seeds, ctx.program_id);

    let recipient_account_wrapper = ctx.remaining_accounts.iter()
      .find(|x| x.key() == profile_treasury.key());

    require!(recipient_account_wrapper.is_some(), errors::SolagramError::RemainingAccountsListMalformed);

    let recipient_account = recipient_account_wrapper.unwrap();

    let cpi_accounts = TransferChecked {
      mint: mint.to_account_info(),
      from: session_treasury_state.to_account_info(),
      to: recipient_account.to_account_info(),
      authority: session_treasury_state.to_account_info(),
    };
  
    let cpi_program = ctx.accounts.token_program.to_account_info();
  
    let cpi_context = CpiContext::new(cpi_program, cpi_accounts)
      .with_signer(signer_seeds);
  
    transfer_checked(cpi_context, session_treasury_state.amount, mint.decimals)?;
  }
  else {
    let signers_count = session_signer_list_state.pubkeys.len() as u64;
    let share = session_treasury_state.amount / signers_count;

    let session_signer_list = session_signer_list_state.pubkeys.clone();

    for participant in session_signer_list {
      let (token_profile_treasury_state, _) = Pubkey::find_program_address(
        &[
          String::from(plugin_api::constants::TOKEN_PROFILE_TREASURY_STATE_SEED_KEY).as_bytes(),
          platform_session_state.interest.token_plugin.key().as_ref(),
          participant.key().as_ref(),
        ],
        ctx.program_id,
      );

      let token_profile_treasury_state_account_wrapper =
        ctx.remaining_accounts.iter().find(|x| x.key() == token_profile_treasury_state.key());

      require!(
        token_profile_treasury_state_account_wrapper.is_some(),
        errors::SolagramError::RemainingAccountsListMalformed,
      );

      let token_profile_treasury_state_account = token_profile_treasury_state_account_wrapper.unwrap();

      transfer_checked(
        CpiContext::new(
          ctx.accounts.token_program.to_account_info(),
          TransferChecked {
            mint: mint.to_account_info(),
            from: session_treasury_state.to_account_info(),
            to: token_profile_treasury_state_account.to_account_info(),
            authority: session_treasury_state.to_account_info(),
          },
        ).with_signer(signer_seeds),
        share, mint.decimals,
      )?;
    }

    session_treasury_state.reload()?;

    transfer_checked(
      CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        TransferChecked {
          mint: mint.to_account_info(),
          from: session_treasury_state.to_account_info(),
          to: ctx.accounts.platform_token_treasury_state.to_account_info(),
          authority: session_treasury_state.to_account_info(),
        },
      ).with_signer(signer_seeds),
      session_treasury_state.amount, mint.decimals,
    )?;
  }

  if platform_session_state.interest.transfer_fee_flag == true {
    harvest_withheld_tokens_to_mint(CpiContext::new(
      ctx.accounts.token_program.to_account_info(),
      HarvestWithheldTokensToMint {
        token_program_id: ctx.accounts.token_program.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
      }
    ), [session_treasury_state.to_account_info()].to_vec())?;
  }

  close_account(CpiContext::new(
    ctx.accounts.token_program.to_account_info(),
    CloseAccount {
      account: session_treasury_state.to_account_info(),
      destination: ctx.accounts.platform_token_treasury_state.to_account_info(),
      authority: session_treasury_state.to_account_info(),
    },
  ).with_signer(signer_seeds))?;

  Ok(())
}

#[derive(Accounts)]
#[instruction(params: plugin_api::states::PurgeProfileSessionsParams)]
pub struct PurgeProfileSessions<'info> {
  #[account(
    mut,

    seeds = [
      String::from(constants::PROFILE_PENDING_SESSION_LIST_STATE_SEED_KEY).as_bytes(),
      signer.key().as_ref(),
    ],
    bump,

    realloc = utils::pubkeys::PubkeyList::space_for(
      profile_pending_session_list_state.pubkeys.len() - params.pending_session_list.len(),
      constants::MAX_PROFILE_PENDING_SESSION_LIST_LENGTH,
    ).unwrap(),
    realloc::payer = signer,
    realloc::zero = false,

    constraint = params.pending_session_list.len() <= profile_pending_session_list_state.pubkeys.len()
      @ errors::SolagramError::PurgeProfileSessionsParamsMalformed,
  )]
  pub profile_pending_session_list_state: Account<'info, utils::pubkeys::PubkeyList>,

  #[account(
    mut,

    seeds = [
      String::from(constants::PROFILE_SESSION_LIST_STATE_SEED_KEY).as_bytes(),
      signer.key().as_ref(),
    ],
    bump,

    realloc = utils::pubkeys::PubkeyList::space_for(
      profile_session_list_state.pubkeys.len() - params.session_list.len(),
      constants::MAX_PROFILE_SESSION_LIST_LENGTH,
    ).unwrap(),
    realloc::payer = signer,
    realloc::zero = false,

    constraint = params.session_list.len() <= profile_session_list_state.pubkeys.len()
      @ errors::SolagramError::PurgeProfileSessionsParamsMalformed,
  )]
  pub profile_session_list_state: Account<'info, utils::pubkeys::PubkeyList>,

  #[account(mut)]
  pub signer: Signer<'info>,

  pub system_program: Program<'info, System>,
}

pub fn purge_profile_sessions<'info>(
  ctx: Context<PurgeProfileSessions>,
  params: plugin_api::states::PurgeProfileSessionsParams,
) -> Result<()> {
  let profile_pending_session_list_state = &mut ctx.accounts.profile_pending_session_list_state;

  for session in params.pending_session_list {
    let position = profile_pending_session_list_state.pubkeys.iter().position(|x| x == &session);

    require!(position.is_some(), errors::SolagramError::PurgeProfileSessionsParamsMalformed);

    profile_pending_session_list_state.pubkeys.remove(position.unwrap());
  }

  let profile_session_list_state = &mut ctx.accounts.profile_session_list_state;

  for session in params.session_list {
    let position = profile_session_list_state.pubkeys.iter().position(|x| x == &session);

    require!(position.is_some(), errors::SolagramError::PurgeProfileSessionsParamsMalformed);

    profile_session_list_state.pubkeys.remove(position.unwrap());
  }

  Ok(())
}
