import { Connection, PublicKey } from "@solana/web3.js";

export default async function getExpectedTransactionCost({
  connection,
  createdAccounts,
  txid,
}: {
  connection: Connection;
  createdAccounts: Array<PublicKey>;
  txid: string;
}): Promise<number> {
  const txResult = await connection.getParsedTransaction(txid, {
    commitment: "confirmed",
  });

  // Note: Sometimes the fee is just 0.
  const txFee = txResult?.meta?.fee ?? 0;

  let createdAccountsCost = 0;
  for (const createdAccount of createdAccounts) {
    const accountIndex = txResult!.transaction!.message.accountKeys.findIndex(
      (val) => val.pubkey.toString() === createdAccount.toString()
    );

    const preBalance = txResult!.meta!.preBalances[accountIndex];
    const postBalance = txResult!.meta!.postBalances[accountIndex];
    const diff = postBalance - preBalance;
    createdAccountsCost += diff;
  }

  return createdAccountsCost + txFee;
}
