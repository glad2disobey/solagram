use anchor_lang::prelude::*;

#[error_code]
pub enum ApplicationError {
  #[msg("Session is not fully signed")]
  SessionNotFullySigned,

  #[msg("Another participant's move")]
  AnotherParticipantsMove,

  #[msg("Coordinates are out of bounds")]
  CoordinatesOutOfBounds,

  #[msg("Cell is occupied")]
  CellOccupied,
}
