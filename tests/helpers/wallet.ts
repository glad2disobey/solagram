import * as kit from "@solana/kit";

import * as connection from "./connection";

const rpcClient = connection.getRpcClient();

const airdrop = kit.airdropFactory(rpcClient);

export async function makeWallet(
  lamports: bigint = 5_000_000_000n,
  commitment: kit.Commitment = "confirmed",
): Promise<kit.KeyPairSigner> {
  const wallet = await kit.generateKeyPairSigner();
  await airdropToWallet(wallet, lamports, commitment);

  return wallet;
}

export async function airdropToWallet(
  wallet: kit.KeyPairSigner,
  lamports: bigint = 5_000_000_000n,
  commitment: kit.Commitment = "confirmed",
) {
  await airdrop({
    recipientAddress: wallet.address,
    lamports: kit.lamports(lamports),
    commitment,
  });
}
