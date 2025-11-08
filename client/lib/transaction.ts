import * as kit from "@solana/kit";

import * as connection from "./connection";

const rpcClient = connection.getRpcClient();

const sendAndConfirmTransaction = kit.sendAndConfirmTransactionFactory(rpcClient);

type TransactionMessage = kit.BaseTransactionMessage
  & kit.TransactionMessageWithFeePayer
  & kit.TransactionMessageWithSigners;

type SignedTransactionMessage = kit.SendableTransaction
  & kit.Transaction
  & kit.TransactionMessageWithBlockhashLifetime;

async function createTransactionBasement(
  payer: kit.KeyPairSigner,
): Promise<TransactionMessage> {
  const { value: latestBlockhash } = await rpcClient.rpc.getLatestBlockhash().send();

  return kit.pipe(
    kit.createTransactionMessage({ version: 0 }),
    (tx) => kit.setTransactionMessageFeePayer(payer.address, tx),
    (tx) => kit.setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx)
  );
}

async function signAndSendTransaction(
  transactionMessage: TransactionMessage,
  commitment: kit.Commitment = "confirmed",
): Promise<kit.Signature> {
  const signedTransaction = await kit.signTransactionMessageWithSigners(transactionMessage);
  const signature = kit.getSignatureFromTransaction(signedTransaction);

  kit.assertIsSendableTransaction(signedTransaction);
  await sendAndConfirmTransaction(signedTransaction as SignedTransactionMessage, { commitment });

  return signature;
}

export async function execute(
  signerList: kit.KeyPairSigner[],
  instructions: kit.Instruction[],
  commitment: kit.Commitment = "confirmed",
) {
  const transactionMessage = kit.pipe(
    await createTransactionBasement(signerList[0]),
    (tx) => kit.appendTransactionMessageInstructions(instructions, tx),
    (tx) => kit.addSignersToTransactionMessage(signerList, tx),
  );

  await signAndSendTransaction(transactionMessage, commitment);
};
