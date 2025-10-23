import * as kit from "@solana/kit";

import * as connection from "./connection";

const rpcClient = connection.getRpcClient();

export async function subscribeToProgramNotifications(
  programAddress: kit.Address,
  abortSignal: AbortSignal,
  commitment: kit.Commitment = "confirmed",
) {
  const programNotifications = await rpcClient.rpcSubscriptions
    .programNotifications(programAddress, { commitment })
    .subscribe({ abortSignal });

  return programNotifications;
}

export async function subscribeToAccountNotifications(
  accountAddress: kit.Address,
  abortSignal: AbortSignal,
  commitment: kit.Commitment = "confirmed",
) {
  const accountNotifications = await rpcClient.rpcSubscriptions
    .accountNotifications(accountAddress, { commitment })
    .subscribe({ abortSignal });

  return accountNotifications;
}
