use anchor_lang::prelude::*;

#[error_code]
pub enum UtilsError {
  #[msg("Unable to add pubkey, limit exceeded")]
  PubkeyListLimitExceeded,

  #[msg("Given PDA is malformed")]
  PDAMalformed,
}
