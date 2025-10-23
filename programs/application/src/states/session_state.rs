use anchor_lang::prelude::*;

#[account]
#[derive(Default, InitSpace)]
pub struct SessionState {
  pub grid: Grid,

  pub created_at: i64,
  pub updated_at: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct MakeMoveParams {
  pub platform_conversation: Pubkey,

  pub participant: Pubkey,
}

#[derive(Copy, Clone, InitSpace, AnchorSerialize, AnchorDeserialize)]
pub enum Sign {
  X,
  O,
}

impl Sign {
  pub fn from_usize(value: usize) -> Sign {
    match value {
      0 => Sign::X,
      _ => Sign::O,
    }
  }
}

#[derive(Copy, Clone, InitSpace, AnchorSerialize, AnchorDeserialize)]
pub struct Grid {
  pub board: [[Option<Sign>; 3]; 3],

  pub current_player: Option<Pubkey>,
}

impl Grid {
  pub fn new(player: Option<Pubkey>) -> Self {
    Self {
      board: [[None; 3]; 3],

      current_player: player,
    }
  }
}

impl Default for Grid {
  fn default() -> Self {
    Self::new(None)
  }
}
