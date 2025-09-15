import * as kit from "@solana/kit";

import * as encoder from "./encoder";

type GetPDAFunctionType = (seeds: Array<encoder.SeedType>) => Promise<kit.Address>;
export function getPDAFactory(programAddress: kit.Address): GetPDAFunctionType {
  const getProgramDerivedAddressOptions = { programAddress };

  return async function(seeds: Array<encoder.SeedType>): Promise<kit.Address> {
    const [pda] = await kit.getProgramDerivedAddress({
      ...getProgramDerivedAddressOptions,

      seeds: encoder.encodeSeeds(seeds),
    });
  
    return pda;
  }
}
