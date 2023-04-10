import { estimateTransactionSizeInBytes } from "@formfunction-hq/formfunction-program-shared";
import {
  ConfirmOptions,
  Connection,
  sendAndConfirmTransaction,
  Signer,
  Transaction,
  TransactionSignature,
} from "@solana/web3.js";
import { IS_DEBUG, LOG_TX_SIZE } from "tests/setup";

/**
 * A wrapper around sendAndConfirmTransaction which logs errors if the
 * tests are run in DEBUG mode. Without this the error.logs output from
 * the Solana Program is suppressed which leaves the errors almost useless.
 */
export default async function sendTransactionForTest(
  connection: Connection,
  transaction: Transaction,
  signers: Array<Signer>,
  options?: ConfirmOptions
): Promise<TransactionSignature> {
  try {
    const txid = await sendAndConfirmTransaction(
      connection,
      transaction,
      signers,
      options
    );

    if (LOG_TX_SIZE) {
      const size = await estimateTransactionSizeInBytes(txid, connection);
      console.log(`Estimated transaction size in bytes = ${size}`);
    }

    return txid;
  } catch (err) {
    if (IS_DEBUG) {
      console.error(err);
    }

    throw err;
  }
}
