import * as kit from "@solana/kit";

import * as error from "./error";

const MAX_U8 = 255;
const MAX_U64 = 18_446_744_073_709_551_615n;

const addressEncoder = kit.getAddressEncoder();
const numberEncoder = kit.getU8Encoder();
const bigintEncoder = kit.getU64Encoder();

export type SeedType = String | Number | BigInt | kit.Address | Uint8Array;

export function encodeSeeds(seeds: Array<SeedType>): Array<Uint8Array | kit.ReadonlyUint8Array> {
  return seeds.map((seed) => {
    switch (true) {
      case seed instanceof Uint8Array:
        return seed;

      case typeof seed === "bigint":
        if (seed < 0 || seed > MAX_U64) throw new error.IntOutOfRangeError();

        return bigintEncoder.encode(seed);

      case typeof seed === "number":
        if (!Number.isInteger(seed)) throw new error.IsNotIntegerError();
        if (seed < 0 || seed > MAX_U8) throw new error.IntOutOfRangeError();

        return numberEncoder.encode(seed);

      case kit.isAddress(seed as kit.Address):
        return addressEncoder.encode(seed as kit.Address);

      case typeof seed === "string":
        if (seed.length > 32) throw new error.StringSeedLengthExceeded();

        return new TextEncoder().encode(seed);

      default:
        throw new error.SeedTypeIsUnsupportedError();
    }
  });
}
