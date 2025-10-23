use anchor_lang::prelude::*;

pub struct PdaValidator;

impl PdaValidator {
  pub fn is_valid<'info>(
    pda: &Pubkey,
    program_id: &Pubkey,
    seeds: &[&[u8]],
    // expected_bump: Option<u8>,
  ) -> bool {
    let (expected_pda, _bump) = Pubkey::find_program_address(seeds, program_id);
    
    if expected_pda != *pda {
      return false;
    }

    // if expected_bump.is_some() && expected_bump.unwrap() != bump {
    //   return false;
    // }

    true
  }
}
