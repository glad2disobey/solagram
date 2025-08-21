use anchor_lang::prelude::*;
use crate::{ state::{ GlobalState, GlobalStateParams } };

#[derive(Accounts)]
#[instruction(params: GlobalStateParams)]
pub struct InitializeGlobalState<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + GlobalState::INIT_SPACE,
        seeds = [b"global_state"],
        bump
    )]
    pub global_state: Account<'info, GlobalState>,

    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn initialize_global_state(
    ctx: Context<InitializeGlobalState>,
    params: GlobalStateParams,
) -> Result<()> {
    let global_state = &mut ctx.accounts.global_state;

    global_state.admin = params.admin;
    
    Ok(())
}
