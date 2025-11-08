use anchor_lang::prelude::*;

use anchor_spl::token_interface::{ Mint, Token2022, TokenAccount };

use solagram;

use crate::{ states, conditions, constants, errors };

#[derive(Accounts)]
pub struct StartSession<'info> {
  #[account(
    mut,

    seeds = [String::from(constants::GLOBAL_STATE_SEED_KEY).as_bytes()],
    bump,
  )]
  pub global_state: Account<'info, states::GlobalState>,

  #[account(
    init,

    space = solagram::utils::constants::ANCHOR_DISCRIMINATOR_SIZE + states::SessionState::INIT_SPACE,
    seeds = [
      String::from(solagram::plugin_api::constants::SESSION_STATE_SEED_KEY).as_bytes(),
      &global_state.session_counter.to_le_bytes(),
    ],
    bump,

    payer = signer,
  )]
  pub session_state: Account<'info, states::SessionState>,

  #[account(mut)]
  signer: Signer<'info>,

  pub system_program: Program<'info, System>,
}

pub fn start_session(
  ctx: Context<StartSession>,
) -> Result<()> {
  let global_state = &mut ctx.accounts.global_state;

  global_state.session_counter = global_state.session_counter.checked_add(1).unwrap();

  let session_state = &mut ctx.accounts.session_state;

  session_state.created_at = Clock::get()?.unix_timestamp;
  session_state.updated_at = Clock::get()?.unix_timestamp;

  let current_participant_index = session_state.key().to_bytes()[31] % 2;

  session_state.grid = states::Grid::default();
  session_state.grid.current_participant_index = current_participant_index;

  Ok(())
}

#[derive(Accounts)]
#[instruction(params: states::MakeMoveParams)]
pub struct MakeMove<'info> {
  #[account(
    seeds = [String::from(constants::GLOBAL_STATE_SEED_KEY).as_bytes()],
    bump,
  )]
  pub global_state: Account<'info, states::GlobalState>,

  #[account(
    mut,

    address = params.session.key(),
  )]
  pub session_state: Account<'info, states::SessionState>,

  #[account(
    mut,

    seeds = [
      String::from(solagram::plugin_api::constants::PLATFORM_SESSION_STATE_SEED_KEY).as_bytes(),
      session_state.key().as_ref(),
    ],
    bump,

    seeds::program = global_state.platform,

    constraint = platform_session_state.is_fully_signed
      @ errors::ApplicationError::SessionNotFullySigned,
  )]
  pub platform_session_state: Account<'info, solagram::plugin_api::states::PlatformSessionState>,

  #[account(
    mut,

    seeds = [
      String::from(solagram::plugin_api::constants::SESSION_PARTICIPANT_LIST_STATE_SEED_KEY).as_bytes(),
      platform_session_state.key().as_ref(),
    ],
    bump,

    seeds::program = global_state.platform,
  )]
  pub session_participant_list_state: Account<'info, solagram::utils::pubkeys::PubkeyList>,

  #[account(
    mut,

    seeds = [
      String::from(solagram::plugin_api::constants::SESSION_SIGNER_LIST_STATE_SEED_KEY).as_bytes(),
      platform_session_state.key().as_ref(),
    ],
    bump,

    seeds::program = global_state.platform,

    constraint = session_signer_list_state
      .pubkeys[session_state.grid.current_participant_index as usize].key() == signer.key()
        @ errors::ApplicationError::AnotherParticipantsMove,
  )]
  pub session_signer_list_state: Account<'info, solagram::utils::pubkeys::PubkeyList>,

  #[account(
    mut,

    seeds = [
      String::from(solagram::plugin_api::constants::PLATFORM_TOKEN_TREASURY_STATE_SEED_KEY).as_bytes(),
      platform_session_state.interest.token_plugin.key().as_ref(),
    ],
    bump,

    seeds::program = global_state.platform,
  )]
  pub platform_token_treasury_state: InterfaceAccount<'info, TokenAccount>,

  #[account(
    mut,

    seeds = [
      String::from(solagram::plugin_api::constants::SESSION_TREASURY_STATE_SEED_KEY).as_bytes(),
      platform_session_state.key().as_ref(),
    ],
    bump,

    seeds::program = global_state.platform,
  )]
  pub session_treasury_state: InterfaceAccount<'info, TokenAccount>,

  #[account(
    mut,

    address = platform_session_state.initiatior_address,
  )]
  /// CHECK: manualy checked
  pub initiator: AccountInfo<'info>,

  #[account(
    mut,

    seeds = [String::from(solagram::plugin_api::constants::SIGNER_SEED_KEY).as_bytes()],
    bump,
  )]
  /// CHECK: manualy checked
  pub pda_signer: AccountInfo<'info>,

  #[account(mut)]
  pub mint: InterfaceAccount<'info, Mint>,

  #[account(mut)]
  signer: Signer<'info>,

  pub solagram: Program<'info, solagram::program::Solagram>,
  pub token_program: Program<'info, Token2022>,
  pub system_program: Program<'info, System>,
}

pub fn make_move<'info>(
  ctx: Context<'_, '_, '_, 'info, MakeMove<'info>>,
  params: states::MakeMoveParams,
)-> Result<()> {
  require!(params.x < 3 && params.y < 3, errors::ApplicationError::CoordinatesOutOfBounds);

  let x = params.x as usize;
  let y = params.y as usize;

  let session_state = &mut ctx.accounts.session_state;

  let current_participant_index = session_state.grid.current_participant_index as usize;

  require!(session_state.grid.board[x][y].is_none(), errors::ApplicationError::CellOccupied);

  let current_participant_sign =
    Some(states::Sign::from_u8(session_state.grid.current_participant_index));

  session_state.grid.board[x][y] = current_participant_sign;

  let signer_seed_key = String::from(solagram::plugin_api::constants::SIGNER_SEED_KEY);

  let seeds: &[&[u8]] = &[
    signer_seed_key.as_bytes(),
    &[ctx.bumps.pda_signer],
  ];

  let signer_seeds = &[&seeds[..]];

  let recipient = if conditions::check_draw_condition(session_state.grid) { None } else {
    Some(ctx.accounts.session_signer_list_state.pubkeys[current_participant_index])
  };

  solagram::cpi::set_recipient(
    CpiContext::new(
      ctx.accounts.solagram.to_account_info(),
      solagram::cpi::accounts::SetRecipient {
        platform_session_state: ctx.accounts.platform_session_state.to_account_info(),
        session_participant_list_state: ctx.accounts.session_participant_list_state.to_account_info(),
        session_signer_list_state: ctx.accounts.session_signer_list_state.to_account_info(),

        pda_signer: ctx.accounts.pda_signer.to_account_info(),

        system_program: ctx.accounts.system_program.to_account_info(),
      },
    ).with_signer(signer_seeds),
    solagram::plugin_api::states::SetRecipientParams {
      inner_session: params.session,
      recipient,
    },
  )?;

  if conditions::check_win_condition(session_state.grid) || conditions::check_draw_condition(session_state.grid) {
    solagram::cpi::close_platform_session(
      CpiContext::new(
        ctx.accounts.solagram.to_account_info(),
        solagram::cpi::accounts::ClosePlatformSession {
          platform_session_state: ctx.accounts.platform_session_state.to_account_info(),
          platform_token_treasury_state: ctx.accounts.platform_token_treasury_state.to_account_info(),
      
          session_treasury_state: ctx.accounts.session_treasury_state.to_account_info(),
          session_signer_list_state: ctx.accounts.session_signer_list_state.to_account_info(),
          session_participant_list_state: ctx.accounts.session_participant_list_state.to_account_info(),
      
          initiator: ctx.accounts.initiator.to_account_info(),
          mint: ctx.accounts.mint.to_account_info(),
      
          token_program: ctx.accounts.token_program.to_account_info(),
          system_program: ctx.accounts.system_program.to_account_info(),
      
          pda_signer: ctx.accounts.pda_signer.to_account_info(),
        },
      ).with_remaining_accounts(ctx.remaining_accounts.to_vec().to_account_infos()).with_signer(signer_seeds),
      solagram::plugin_api::states::ClosePlatformSessionParams {
        inner_session: params.session,
      },
    )?;
  }
  else {
    session_state.grid.current_participant_index = if current_participant_index == 1 { 0 } else { 1 };
    session_state.updated_at = Clock::get()?.unix_timestamp;
  }

  Ok(())
}

#[derive(Accounts)]
#[instruction(params: states::ResignParams)]
pub struct Resign<'info> {
  #[account(
    seeds = [String::from(constants::GLOBAL_STATE_SEED_KEY).as_bytes()],
    bump,
  )]
  pub global_state: Account<'info, states::GlobalState>,

  #[account(
    mut,

    address = params.session.key(),
  )]
  pub session_state: Account<'info, states::SessionState>,

  #[account(
    mut,

    seeds = [
      String::from(solagram::plugin_api::constants::PLATFORM_SESSION_STATE_SEED_KEY).as_bytes(),
      session_state.key().as_ref(),
    ],
    bump,

    seeds::program = global_state.platform,

    constraint = platform_session_state.is_fully_signed
      @ errors::ApplicationError::SessionNotFullySigned,
  )]
  pub platform_session_state: Account<'info, solagram::plugin_api::states::PlatformSessionState>,

  #[account(
    mut,

    seeds = [
      String::from(solagram::plugin_api::constants::SESSION_PARTICIPANT_LIST_STATE_SEED_KEY).as_bytes(),
      platform_session_state.key().as_ref(),
    ],
    bump,

    seeds::program = global_state.platform,
  )]
  pub session_participant_list_state: Account<'info, solagram::utils::pubkeys::PubkeyList>,

  #[account(
    mut,

    seeds = [
      String::from(solagram::plugin_api::constants::SESSION_SIGNER_LIST_STATE_SEED_KEY).as_bytes(),
      platform_session_state.key().as_ref(),
    ],
    bump,

    seeds::program = global_state.platform,

    constraint = session_signer_list_state.pubkeys.contains(&signer.key())
      @ solagram::errors::SolagramError::Unauthorized,
  )]
  pub session_signer_list_state: Account<'info, solagram::utils::pubkeys::PubkeyList>,

  #[account(
    mut,

    seeds = [
      String::from(solagram::plugin_api::constants::PLATFORM_TOKEN_TREASURY_STATE_SEED_KEY).as_bytes(),
      platform_session_state.interest.token_plugin.key().as_ref(),
    ],
    bump,

    seeds::program = global_state.platform,
  )]
  pub platform_token_treasury_state: InterfaceAccount<'info, TokenAccount>,

  #[account(
    mut,

    seeds = [
      String::from(solagram::plugin_api::constants::SESSION_TREASURY_STATE_SEED_KEY).as_bytes(),
      platform_session_state.key().as_ref(),
    ],
    bump,

    seeds::program = global_state.platform,
  )]
  pub session_treasury_state: InterfaceAccount<'info, TokenAccount>,

  #[account(
    mut,

    address = platform_session_state.initiatior_address,
  )]
  /// CHECK: manualy checked
  pub initiator: AccountInfo<'info>,

  #[account(
    mut,

    seeds = [String::from(solagram::plugin_api::constants::SIGNER_SEED_KEY).as_bytes()],
    bump,
  )]
  /// CHECK: manualy checked
  pub pda_signer: AccountInfo<'info>,

  #[account(mut)]
  pub mint: InterfaceAccount<'info, Mint>,

  #[account(mut)]
  signer: Signer<'info>,

  pub solagram: Program<'info, solagram::program::Solagram>,
  pub token_program: Program<'info, Token2022>,
  pub system_program: Program<'info, System>,
}

pub fn resign<'info>(
  ctx: Context<'_, '_, '_, 'info, Resign<'info>>,
  params: states::ResignParams,
)-> Result<()> {
  let signer_seed_key = String::from(solagram::plugin_api::constants::SIGNER_SEED_KEY);

  let seeds: &[&[u8]] = &[
    signer_seed_key.as_bytes(),
    &[ctx.bumps.pda_signer],
  ];

  let signer_seeds = &[&seeds[..]];

  let session_signer_list_state = &mut ctx.accounts.session_signer_list_state;

  let recipient = session_signer_list_state.pubkeys.iter()
    .find(|x| x.key() != ctx.accounts.signer.key()).unwrap();

  solagram::cpi::set_recipient(
    CpiContext::new(
      ctx.accounts.solagram.to_account_info(),
      solagram::cpi::accounts::SetRecipient {
        platform_session_state: ctx.accounts.platform_session_state.to_account_info(),
        session_participant_list_state: ctx.accounts.session_participant_list_state.to_account_info(),
        session_signer_list_state: session_signer_list_state.to_account_info(),

        pda_signer: ctx.accounts.pda_signer.to_account_info(),

        system_program: ctx.accounts.system_program.to_account_info(),
      },
    ).with_signer(signer_seeds),
    solagram::plugin_api::states::SetRecipientParams {
      inner_session: params.session,
      recipient: Some(*recipient),
    },
  )?;

  solagram::cpi::close_platform_session(
    CpiContext::new(
      ctx.accounts.solagram.to_account_info(),
      solagram::cpi::accounts::ClosePlatformSession {
        platform_session_state: ctx.accounts.platform_session_state.to_account_info(),
        platform_token_treasury_state: ctx.accounts.platform_token_treasury_state.to_account_info(),
    
        session_treasury_state: ctx.accounts.session_treasury_state.to_account_info(),
        session_signer_list_state: ctx.accounts.session_signer_list_state.to_account_info(),
        session_participant_list_state: ctx.accounts.session_participant_list_state.to_account_info(),
    
        initiator: ctx.accounts.initiator.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
    
        token_program: ctx.accounts.token_program.to_account_info(),
        system_program: ctx.accounts.system_program.to_account_info(),
    
        pda_signer: ctx.accounts.pda_signer.to_account_info(),
      },
    ).with_remaining_accounts(ctx.remaining_accounts.to_vec().to_account_infos()).with_signer(signer_seeds),
    solagram::plugin_api::states::ClosePlatformSessionParams {
      inner_session: params.session,
    },
  )?;

  Ok(())
}
