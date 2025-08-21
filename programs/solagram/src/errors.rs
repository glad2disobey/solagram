use anchor_lang::prelude::*;

#[error_code]
pub enum ProgramError {
    #[msg("Profile name too long")]
    ProfileNameTooLong,
    #[msg("Insufficient funds")]
    InsufficientFunds,
    #[msg("Unauthorized access")]
    Unauthorized,
}
