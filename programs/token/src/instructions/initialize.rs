use anchor_lang::{
  prelude::*,

  system_program,
  solana_program,
};

use anchor_spl::{
  token_interface::{
    Token2022,

    TokenMetadataInitialize,
    MetadataPointerInitialize,
    TransferFeeInitialize,

    token_metadata_initialize,
    metadata_pointer_initialize,
    transfer_fee_initialize,
  },
  token_2022::{
    spl_token_2022::{
      extension::{
        ExtensionType,
      },

      pod::PodMint,
    },
    InitializeMint2,

    initialize_mint2,
  },
};

use spl_token_metadata_interface::state::TokenMetadata;
use spl_type_length_value::variable_len_pack::VariableLenPack;

use crate::{ constants, states };

use solagram::utils;

#[derive(Accounts)]
pub struct Initialize<'info> {
  #[account(
    init,

    space = utils::constants::ANCHOR_DISCRIMINATOR_SIZE + states::GlobalState::INIT_SPACE,

    seeds = [String::from(constants::GLOBAL_STATE_SEED_KEY).as_bytes()],
    bump,

    payer = admin,
  )]
  pub global_state: Account<'info, states::GlobalState>,

  #[account(mut)]
  pub mint_account: Signer<'info>,

  #[account(mut)]
  pub admin: Signer<'info>,

  pub token_program: Program<'info, Token2022>,
  pub system_program: Program<'info, System>,
}

pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
  let global_state = &mut ctx.accounts.global_state;

  global_state.mint = ctx.accounts.mint_account.key();

  let token_metadata = TokenMetadata {
    name: String::from(constants::TOKEN_NAME),
    symbol: String::from(constants::TOKEN_SYMBOL),
    uri: String::from(constants::TOKEN_URI),

    ..Default::default()
  };

  let metadata_space = constants::METADATA_EXTENSION_EXTRA_SIZE + token_metadata.get_packed_len().unwrap();

  let metadata_space_lamports = metadata_space as u64
    * solana_program::rent::DEFAULT_LAMPORTS_PER_BYTE_YEAR
    * solana_program::rent::DEFAULT_EXEMPTION_THRESHOLD as u64;

  let extensions_space = ExtensionType::try_calculate_account_len::<PodMint>(&[
    ExtensionType::TransferFeeConfig,
    ExtensionType::MetadataPointer,
  ])?;

  let extensions_space_lamports = (Rent::get()?).minimum_balance(extensions_space);

  system_program::create_account(
    CpiContext::new(
      ctx.accounts.system_program.to_account_info(),
      system_program::CreateAccount {
        from: ctx.accounts.admin.to_account_info(),
        to: ctx.accounts.mint_account.to_account_info(),
      }
    ),

    extensions_space_lamports,
    (extensions_space) as u64,
    &ctx.accounts.token_program.key(),
  )?;

  metadata_pointer_initialize(
    CpiContext::new(
      ctx.accounts.token_program.to_account_info(),
      MetadataPointerInitialize {
        token_program_id: ctx.accounts.token_program.to_account_info(),
        mint: ctx.accounts.mint_account.to_account_info(),
      }
    ),

    Some(ctx.accounts.admin.key()),
    Some(ctx.accounts.mint_account.key()),
  )?;

  system_program::transfer(
    CpiContext::new(
      ctx.accounts.system_program.to_account_info(),
      system_program::Transfer {
        from: ctx.accounts.admin.to_account_info(),
        to: ctx.accounts.mint_account.to_account_info(),
      },
    ),

    metadata_space_lamports,
  )?;

  transfer_fee_initialize(
    CpiContext::new(
      ctx.accounts.token_program.to_account_info(),
      TransferFeeInitialize {
        token_program_id: ctx.accounts.token_program.to_account_info(),
        mint: ctx.accounts.mint_account.to_account_info(),
      },
    ),

    Some(&ctx.accounts.admin.key()),
    Some(&ctx.accounts.admin.key()),

    constants::DEFAULT_TRANSFER_FEE_BASIS_POINTS,
    constants::DEFAULT_MAXIMUM_FEE,
  )?;

  initialize_mint2(
    CpiContext::new(
      ctx.accounts.token_program.to_account_info(),
      InitializeMint2 {
        mint: ctx.accounts.mint_account.to_account_info(),
      }),

      constants::TOKEN_DECIMALS,

      &ctx.accounts.admin.key(),
      Some(&ctx.accounts.admin.key()),
  )?;

  token_metadata_initialize(
    CpiContext::new(
      ctx.accounts.token_program.to_account_info(),
      TokenMetadataInitialize {
        program_id: ctx.accounts.token_program.to_account_info(),
        mint: ctx.accounts.mint_account.to_account_info(),
        metadata: ctx.accounts.mint_account.to_account_info(),
        mint_authority: ctx.accounts.admin.to_account_info(),
        update_authority: ctx.accounts.admin.to_account_info(),
      },
    ),

    token_metadata.name,
    token_metadata.symbol,
    token_metadata.uri,
  )?;

  Ok(())
}
