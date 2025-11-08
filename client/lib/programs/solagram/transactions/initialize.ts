import * as kit from "@solana/kit";

import * as instructions from "../instructions";
import * as transation from "../../../transaction";

interface InitializePlatformInterface {
  admin: kit.KeyPairSigner,
}

export async function initializePlatform(
  options: InitializePlatformInterface,
  commitment: kit.Commitment = "confirmed",
) {
  const initializeInstruction = await instructions.initialize.getInitializeInstruction({
    admin: options.admin,
  });

  await transation.execute([options.admin], [initializeInstruction], commitment);
}
