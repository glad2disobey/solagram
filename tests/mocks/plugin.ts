import * as kit from "@solana/kit";

import * as programClient from "../../clients/js/src/generated";

export async function createPlugin(): Promise<kit.Address> {
  const fakePlugin = await kit.generateKeyPairSigner();

  return fakePlugin.address;
}
