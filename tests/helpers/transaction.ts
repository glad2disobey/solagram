import * as kit from "@solana/kit";

import * as connection from "./connection";

const rpcClient = connection.getRpcClient();

const sendAndConfirmTransaction = kit.sendAndConfirmTransactionFactory(rpcClient);

export async function createTransactionBasement(
  feePayerSigner: kit.KeyPairSigner,
) {
  const { value: latestBlockhash } = await rpcClient.rpc.getLatestBlockhash().send();

  return kit.pipe(
    kit.createTransactionMessage({ version: 0 }),
    (tx) => kit.setTransactionMessageFeePayerSigner(feePayerSigner, tx),
    (tx) => kit.setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx)
  );
}

export async function signAndSendTransaction(
  transactionMessage: kit.CompilableTransactionMessage & kit.TransactionMessageWithBlockhashLifetime,
  commitment: kit.Commitment = "confirmed",
): Promise<kit.Signature> {
  const signedTransaction = await kit.signTransactionMessageWithSigners(transactionMessage);
  const signature = kit.getSignatureFromTransaction(signedTransaction);

  await sendAndConfirmTransaction(signedTransaction, { commitment });

  return signature;
}
