use anchor_lang::prelude::*;

#[account]
#[derive(Default, InitSpace)]
pub struct SessionState {
  pub grid: Grid,

  pub created_at: i64,
  pub updated_at: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct ResignParams {
  pub session: Pubkey,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct MakeMoveParams {
  pub session: Pubkey,

  pub x: u8,
  pub y: u8,
}

#[derive(Copy, Clone, InitSpace, AnchorSerialize, AnchorDeserialize, PartialEq)]
pub enum Sign {
  X,
  O,
}

impl Sign {
  pub fn from_u8(value: u8) -> Sign {
    match value {
      0 => Sign::X,
      _ => Sign::O,
    }
  }
}

#[derive(Copy, Clone, InitSpace, AnchorSerialize, AnchorDeserialize)]
pub struct Grid {
  pub board: [[Option<Sign>; 3]; 3],

  pub current_participant_index: u8,
}

impl Grid {
  pub fn new(participant_index: u8) -> Self {
    Self {
      board: [[None; 3]; 3],

      current_participant_index: participant_index,
    }
  }
}

impl Default for Grid {
  fn default() -> Self {
    Self::new(0)
  }
}
