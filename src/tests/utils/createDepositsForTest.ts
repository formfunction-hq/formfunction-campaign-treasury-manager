import {
  forEachAsync,
  fundSplTokenAtas,
  generateKeypairArray,
  isMintNative,
  mintMasterEditionForTest,
  requestAirdrops,
  solToLamports,
  sumArray,
} from "@formfunction-hq/formfunction-program-shared";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import CampaignTreasuryManagerSdk from "sdk/CampaignTreasuryManagerSdk";
import createDepositForTest from "tests/utils/createDepositForTest";

export default async function createDepositsForTest({
  authority,
  campaignUuid,
  connection,
  depositAmounts,
  depositCurrency,
  sdk,
}: {
  authority: Keypair;
  campaignUuid: string;
  connection: Connection;
  depositAmounts: Array<number>;
  depositCurrency: PublicKey;
  sdk: CampaignTreasuryManagerSdk;
}): Promise<{ totalDepositAmount: number }> {
  const totalDepositAmount = solToLamports(sumArray(depositAmounts));
  const buyers = generateKeypairArray(depositAmounts.length);

  await requestAirdrops({
    connection,
    wallets: buyers,
  });

  const isDepositNative = isMintNative(depositCurrency);

  await forEachAsync(buyers, async (buyer, index) => {
    const masterEditionMint = await mintMasterEditionForTest(buyer, connection);
    const depositAmount = isDepositNative
      ? solToLamports(depositAmounts[index])
      : depositAmounts[index];

    if (!isDepositNative) {
      await fundSplTokenAtas(
        connection,
        [buyer.publicKey],
        depositCurrency,
        authority,
        depositAmount
      );
    }

    await createDepositForTest({
      buyer,
      campaignUuid,
      connection,
      depositAmount,
      depositCurrency,
      masterEditionMint,
      sdk,
    });
  });

  return { totalDepositAmount };
}
