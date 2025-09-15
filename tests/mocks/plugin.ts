import * as kit from "@solana/kit";

export async function createPlugin(): Promise<kit.Address> {
  const fakePlugin = await kit.generateKeyPairSigner();

  return fakePlugin.address;
}
