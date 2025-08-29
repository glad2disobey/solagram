import * as kit from "@solana/kit";

import * as connection from "./connection";

const rpcClient = connection.getRpcClient();

const sendAndConfirmTransaction = kit.sendAndConfirmTransactionFactory(rpcClient);

type TransactionMessage = kit.BaseTransactionMessage & kit.TransactionMessageWithFeePayer & kit.TransactionMessageWithSigners;
type SignedTransactionMessage = kit.SendableTransaction & kit.Transaction & kit.TransactionMessageWithBlockhashLifetime;

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
  transactionMessage: TransactionMessage,
  commitment: kit.Commitment = "confirmed",
): Promise<kit.Signature> {
  const signedTransaction = await kit.signTransactionMessageWithSigners(transactionMessage);
  const signature = kit.getSignatureFromTransaction(signedTransaction);

  await kit.assertIsSendableTransaction(signedTransaction);
  await sendAndConfirmTransaction(signedTransaction as SignedTransactionMessage, { commitment });

  return signature;
}

export async function executeTransactions(
  wallet: kit.KeyPairSigner,
  instructions: kit.Instruction[],
  commitment: kit.Commitment = "confirmed",
) {
  await kit.pipe(
    await createTransactionBasement(wallet),
    (tx) => kit.appendTransactionMessageInstructions(instructions, tx),
    (tx) => signAndSendTransaction(tx, commitment),
  );
};
