use anchor_lang::prelude::*;

use anchor_spl::{
  token_interface::{
    Mint, Token2022, TokenAccount,
    
    TransferChecked,
    transfer_checked,

    CloseAccount,
    close_account,
  },
};

use crate::{ plugin_api, utils, errors };

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

  #[account(mut)]
  pub signer: Signer<'info>,

  pub mint: InterfaceAccount<'info, Mint>,
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

  platform_session_state.recipient = None;
  
  let session_participant_list_state = &mut ctx.accounts.session_participant_list_state;
  session_participant_list_state.pubkeys = params.participants;

  let session_signer_list_state = &mut ctx.accounts.session_signer_list_state;
  session_signer_list_state.pubkeys = Vec::new();

  Ok(())
}

#[derive(Accounts)]
#[instruction(params: plugin_api::states::SignPlatformSessionParams)]
pub struct SignPlatformSession<'info> {
  #[account(
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

    constraint = !session_participant_list_state.pubkeys.contains(&signer.key())
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

    constraint = session_signer_list_state.pubkeys.contains(&signer.key())
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
  )]
  pub token_profile_treasury_state: InterfaceAccount<'info, TokenAccount>,

  #[account(mut)]
  pub signer: Signer<'info>,

  pub mint: InterfaceAccount<'info, Mint>,
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

  require!(token_profile_treasury_state.amount >= platform_session_state.interest.share,
    errors::SolagramError::InsufficientFunds);

  let token_profile_treasury_state_seed_key = String::from(plugin_api::constants::TOKEN_PROFILE_TREASURY_STATE_SEED_KEY);
  let token_plugin_pubkey = platform_session_state.interest.token_plugin.key();

  let seeds: &[&[u8]] = &[
    token_profile_treasury_state_seed_key.as_bytes(),
    token_plugin_pubkey.as_ref(),
    &[ctx.bumps.token_profile_treasury_state],
  ];

  let signer_seeds = &[&seeds[..]];

  let cpi_accounts = TransferChecked {
    mint: mint.to_account_info(),
    from: token_profile_treasury_state.to_account_info(),
    to: session_treasury_state.to_account_info(),
    authority: token_profile_treasury_state.to_account_info(),
  };

  let cpi_program = ctx.accounts.token_program.to_account_info();

  let cpi_context = CpiContext::new(cpi_program, cpi_accounts)
    .with_signer(signer_seeds);

  transfer_checked(cpi_context, platform_session_state.interest.share, mint.decimals)?;

  let session_signer_list_state = &mut ctx.accounts.session_signer_list_state;

  session_signer_list_state.pubkeys.push(ctx.accounts.signer.key());

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

    constraint = !session_participant_list_state.pubkeys.contains(&signer.key())
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

    constraint = session_signer_list_state.pubkeys.contains(&signer.key())
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


  #[account(mut)]
  pub signer: Signer<'info>,

  pub mint: InterfaceAccount<'info, Mint>,
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

    let initial_signers_count = session_signer_list_state.pubkeys.len();
    let mut money_back_recipients_count: usize = 0;

    for account in ctx.remaining_accounts.iter() {
      if session_signer_list_state.pubkeys.contains(&account.key()) {
        let cpi_accounts = TransferChecked {
          mint: mint.to_account_info(),
          from: session_treasury_state.to_account_info(),
          to: account.to_account_info(),
          authority: session_treasury_state.to_account_info(),
        };
      
        let cpi_program = ctx.accounts.token_program.to_account_info();
      
        let cpi_context = CpiContext::new(cpi_program, cpi_accounts)
          .with_signer(signer_seeds);
      
        transfer_checked(cpi_context, share, mint.decimals)?;

        let signer_position = session_signer_list_state.pubkeys.iter()
          .position(|x| x.key() == account.key()).unwrap();

        session_signer_list_state.pubkeys.remove(signer_position);

        money_back_recipients_count += 1;
      }
    }

    require!(initial_signers_count != money_back_recipients_count,
      errors::SolagramError::RemainingAccountsListMalformed);
  }

  let cpi_accounts = CloseAccount {
    account: session_treasury_state.to_account_info(),
    destination: ctx.accounts.platform_token_treasury_state.to_account_info(),
    authority: session_treasury_state.to_account_info(),
  };

  let cpi_program = ctx.accounts.token_program.to_account_info();

  let cpi_context = CpiContext::new(cpi_program, cpi_accounts)
    .with_signer(signer_seeds);

  close_account(cpi_context)?;

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

  let session_participant_list_state = &mut ctx.accounts.session_participant_list_state;
  let session_signer_list_state = &mut ctx.accounts.session_signer_list_state;

  require!(
    utils::PdaValidator::is_valid(
      &ctx.accounts.pda_signer.key(),
      &platform_session_state.application_plugin,
      &[String::from(plugin_api::constants::SIGNER_SEED_KEY).as_bytes()],
    ),
    errors::SolagramError::Unauthorized,
  );

  require!(session_signer_list_state.pubkeys.len() == session_participant_list_state.pubkeys.len(),
    errors::SolagramError::SessionNotFullySigned);

  require!(
    params.recipient.is_none()
      || session_signer_list_state.pubkeys.contains(&params.recipient.unwrap()),

    errors::SolagramError::SetRecipientParamsMalformed
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
  pub pda_signer: Signer<'info>,

  pub mint: InterfaceAccount<'info, Mint>,
  pub token_program: Program<'info, Token2022>,
  pub system_program: Program<'info, System>,
}

pub fn close_platform_session<'info>(
  ctx: Context<'_, '_, '_, 'info, ClosePlatformSession<'info>>,
  _params: plugin_api::states::ClosePlatformSessionParams,
) -> Result<()> {
  let mint = &mut ctx.accounts.mint;

  let platform_session_state = &mut ctx.accounts.platform_session_state;

  let session_participant_list_state = &mut ctx.accounts.session_participant_list_state;
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

  require!(session_signer_list_state.pubkeys.len() == session_participant_list_state.pubkeys.len(),
    errors::SolagramError::SessionNotFullySigned);

  let seeds: &[&[u8]] = &[
    session_treasury_state_seed_key.as_bytes(),
    platform_session_state_key.as_ref(),
    &[ctx.bumps.session_treasury_state],
  ];

  let signer_seeds = &[&seeds[..]];

  if platform_session_state.recipient.is_some() {
    let recipient_account_wrapper = ctx.remaining_accounts.iter()
      .find(|x| x.key() == platform_session_state.recipient.unwrap());

    require!(recipient_account_wrapper.is_some(),
      errors::SolagramError::RemainingAccountsListMalformed);

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
    let signers_count: u64 = session_signer_list_state.pubkeys.len() as u64;
    let share = session_treasury_state.amount / signers_count;

    let initial_signers_count = session_signer_list_state.pubkeys.len();
    let mut money_back_recipients_count: usize = 0;

    for account in ctx.remaining_accounts.iter() {
      if session_signer_list_state.pubkeys.contains(&account.key()) {
        let cpi_accounts = TransferChecked {
          mint: mint.to_account_info(),
          from: session_treasury_state.to_account_info(),
          to: account.to_account_info(),
          authority: session_treasury_state.to_account_info(),
        };
      
        let cpi_program = ctx.accounts.token_program.to_account_info();
      
        let cpi_context = CpiContext::new(cpi_program, cpi_accounts)
          .with_signer(signer_seeds);
      
        transfer_checked(cpi_context, share, mint.decimals)?;

        let signer_position = session_signer_list_state.pubkeys.iter()
          .position(|x| x.key() == account.key()).unwrap();

        session_signer_list_state.pubkeys.remove(signer_position);

        money_back_recipients_count += 1;
      }
    }

    require!(initial_signers_count != money_back_recipients_count,
      errors::SolagramError::RemainingAccountsListMalformed);
  }

  let cpi_accounts = CloseAccount {
    account: session_treasury_state.to_account_info(),
    destination: ctx.accounts.platform_token_treasury_state.to_account_info(),
    authority: session_treasury_state.to_account_info(),
  };

  let cpi_program = ctx.accounts.token_program.to_account_info();

  let cpi_context = CpiContext::new(cpi_program, cpi_accounts)
    .with_signer(signer_seeds);

  close_account(cpi_context)?;

  Ok(())
}
