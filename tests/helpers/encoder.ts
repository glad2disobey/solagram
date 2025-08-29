import * as kit from "@solana/kit";

import * as error from "./error";

const addressEncoder = kit.getAddressEncoder();
const numberEncoder = kit.getU8Encoder();

export type SeedType = String | number | kit.Address | Uint8Array;

export function encodeSeeds(seeds: Array<SeedType>): Array<Uint8Array | kit.ReadonlyUint8Array> {
  return seeds.map((seed) => {
    switch (true) {
      case seed instanceof Uint8Array:
        return seed;

      case typeof seed === "number":
        if (!Number.isInteger(seed)) throw new error.IsNotIntegerError();
        if (seed < 0 || seed > 255) throw new error.IntOutOfRangeError();

        return numberEncoder.encode(seed);

      case kit.isAddress(seed as kit.Address):
        return addressEncoder.encode(seed as kit.Address);

      case typeof seed === "string":
        return new TextEncoder().encode(seed);

      default:
        throw new error.SeedTypeIsUnsupportedError();
    }
  });
}
