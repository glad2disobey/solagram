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

  // for await (const programNotification of programNotifications) {
  //   console.log(`Program(${ programAddress }) notification: `);
  //   console.dir(programNotification, { depth: 3 });
  // }

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

  // for await (const accountNotification of accountNotifications) {
  //   console.log(`Account(${ accountAddress }) notification: `);
  //   console.dir(accountNotification, { depth: 3 });
  // }

  return accountNotifications;
}
