use anchor_lang::prelude::*;

use anchor_spl::{
  token_interface::{
    Mint, Token2022, TokenAccount,
    
    TransferChecked,
    transfer_checked,
  },

  associated_token::{
    AssociatedToken,
  }
};

use crate::{
  platform::{ states },

  plugin_api, utils, constants, errors,
};

#[derive(Accounts)]
pub struct CreateProfile<'info> {
  #[account(
    init,

    space = utils::constants::ANCHOR_DISCRIMINATOR_SIZE + states::ProfileState::INIT_SPACE,
    seeds = [
      String::from(constants::PROFILE_STATE_SEED_KEY).as_bytes(),
      signer.key().as_ref(),
    ],
    bump,

    payer = signer,
  )]
  pub profile_state: Account<'info, states::ProfileState>,

  #[account(
    init,

    space = utils::pubkeys::PubkeyList::space_for(0, constants::MAX_PROFILE_COMMUNICATION_LIST_LENGTH).unwrap(),
    seeds = [
      String::from(constants::PROFILE_COMMUNICATION_LIST_STATE_SEED_KEY).as_bytes(),
      signer.key().as_ref(),
    ],
    bump,

    payer = signer,
  )]
  pub profile_communication_list_state: Account<'info, utils::pubkeys::PubkeyList>,
  
  #[account(
    mut,

    seeds = [String::from(constants::GLOBAL_STATE_SEED_KEY).as_bytes()],
    bump,
  )]
  pub global_state: Account<'info, states::GlobalState>,

  #[account(mut)]
  pub signer: Signer<'info>,

  pub token_program: Program<'info, Token2022>,
  pub associated_token_program: Program<'info, AssociatedToken>,
  pub system_program: Program<'info, System>,
}

pub fn create_profile(
  ctx: Context<CreateProfile>,
  name: String,
) -> Result<()> {
  require!(name.len() <= constants::MAX_PROFILE_NAME_LENGTH, errors::SolagramError::ProfileNameTooLong);
  
  let profile_state = &mut ctx.accounts.profile_state;
  profile_state.authority = ctx.accounts.signer.key();
  profile_state.name = name;

  profile_state.created_at = Clock::get()?.unix_timestamp;
  profile_state.updated_at = Clock::get()?.unix_timestamp;

  let profile_communication_list_state = &mut ctx.accounts.profile_communication_list_state;
  profile_communication_list_state.pubkeys = Vec::new();
  profile_communication_list_state.bump = ctx.bumps.profile_communication_list_state;

  let global_state = &mut ctx.accounts.global_state;
  global_state.profile_counter = global_state.profile_counter.checked_add(1).unwrap();
  
  Ok(())
}

#[derive(Accounts)]
#[instruction(token_plugin: Pubkey)]
pub struct CreateTokenAccount<'info> {
  #[account(
    init,

    token::mint = mint,
    token::authority = token_profile_treasury_state,
    token::token_program = token_program,

    seeds = [
      String::from(plugin_api::constants::TOKEN_PROFILE_TREASURY_STATE_SEED_KEY).as_bytes(),
      token_plugin.key().as_ref(),
      signer.key().as_ref(),
    ],
    bump,

    payer = signer,
  )]
  pub token_profile_treasury_state: InterfaceAccount<'info, TokenAccount>,

  // Just in case
  #[account(
    init_if_needed,

    associated_token::mint = mint,
    associated_token::authority = signer,
    associated_token::token_program = token_program,

    payer = signer,
  )]
  pub associated_token_account: InterfaceAccount<'info, TokenAccount>,

  #[account(
    seeds = [
      String::from(plugin_api::constants::PLATFORM_TOKEN_STATE_SEED_KEY).as_bytes(),
      token_plugin.key().as_ref(),
    ],
    bump,
  )]
  pub platform_token_state: Account<'info, plugin_api::states::PlatformTokenState>,

  #[account(
    mut,

    seeds = [
      String::from(plugin_api::constants::PLATFORM_TOKEN_TREASURY_STATE_SEED_KEY).as_bytes(),
      token_plugin.key().as_ref(),
    ],
    bump,
  )]
  pub platform_token_treasury_state: InterfaceAccount<'info, TokenAccount>,

  #[account(
    seeds = [String::from(plugin_api::constants::TOKEN_PLUGIN_LIST_STATE_SEED_KEY).as_bytes()],
    bump = token_plugin_list_state.bump,
  )]
  pub token_plugin_list_state: Account<'info, utils::pubkeys::PubkeyList>,

  #[account(mut)]
  pub signer: Signer<'info>,

  pub mint: InterfaceAccount<'info, Mint>,
  pub token_program: Program<'info, Token2022>,
  pub associated_token_program: Program<'info, AssociatedToken>,
  pub system_program: Program<'info, System>,
}

pub fn create_token_account(
  ctx: Context<CreateTokenAccount>,
  token_plugin: Pubkey,
) -> Result<()> {
  let mint = &mut ctx.accounts.mint;

  let platform_token_state = &mut ctx.accounts.platform_token_state;
  let platform_token_treasury_state = &mut ctx.accounts.platform_token_treasury_state;

  let token_profile_treasury_state = &mut ctx.accounts.token_profile_treasury_state;

  let token_plugin_list_state = &mut ctx.accounts.token_plugin_list_state;

  let platform_token_treasury_state_seed_key = String::from(plugin_api::constants::PLATFORM_TOKEN_TREASURY_STATE_SEED_KEY);

  require!(mint.key().as_ref() == platform_token_state.mint_address.key().as_ref(),
    errors::SolagramError::CreateTokenAccountParamsMalformed);

  require!(token_plugin_list_state.pubkeys.contains(&token_plugin),
    errors::SolagramError::PluginNotFound);

  if platform_token_state.airdrop_amount > 0
    && platform_token_treasury_state.amount >= platform_token_state.airdrop_amount
  {
    let seeds: &[&[u8]] = &[
      platform_token_treasury_state_seed_key.as_bytes(),
      token_plugin.as_ref(),
      &[ctx.bumps.platform_token_treasury_state],
    ];

    let signer_seeds = &[&seeds[..]];

    let cpi_accounts = TransferChecked {
      mint: mint.to_account_info(),
      from: platform_token_treasury_state.to_account_info(),
      to: token_profile_treasury_state.to_account_info(),
      authority: platform_token_treasury_state.to_account_info(),
    };

    let cpi_program = ctx.accounts.token_program.to_account_info();

    let cpi_context = CpiContext::new(cpi_program, cpi_accounts)
      .with_signer(signer_seeds);

    transfer_checked(cpi_context, platform_token_state.airdrop_amount, mint.decimals)?;
  }

  Ok(())
}
