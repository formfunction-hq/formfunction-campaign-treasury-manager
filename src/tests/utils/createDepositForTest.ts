import {
  expectAccountOwnedBy,
  expectNumbersEqual,
  expectPublicKeysEqual,
  findAtaPda,
  getTokenBalance,
  isMintNative,
} from "@formfunction-hq/formfunction-program-shared";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import BN from "bn.js";
import CampaignTreasuryManagerSdk from "sdk/CampaignTreasuryManagerSdk";
import findDepositEscrowPda from "sdk/pdas/findDepositEscrowPda";
import findDepositRecordPda from "sdk/pdas/findDepositRecordPda";
import findTreasuryEscrowPda from "sdk/pdas/findTreasuryEscrowPda";
import getExpectedTransactionCost from "tests/utils/getExpectedTransactionCost";
import sendTransactionForTest from "tests/utils/sendTransactionForTest";

export default async function createDepositForTest({
  buyer,
  campaignUuid,
  connection,
  depositAmount,
  depositCurrency,
  masterEditionMint,
  sdk,
}: {
  buyer: Keypair;
  campaignUuid: string;
  connection: Connection;
  depositAmount: number;
  depositCurrency: PublicKey;
  masterEditionMint: PublicKey;
  sdk: CampaignTreasuryManagerSdk;
}): Promise<void> {
  const startingCampaignEscrowAccount =
    await sdk.fetchCampaignEscrowAccountWithCampaignUuid(campaignUuid);

  const isTreasuryNative = isMintNative(
    startingCampaignEscrowAccount.treasury.treasuryMint
  );
  const depositMatchesTreasury =
    startingCampaignEscrowAccount.treasury.treasuryMint.toString() ===
    depositCurrency.toString();

  const isDepositNative = isMintNative(depositCurrency);

  const [buyerSaleCurrencyAta] = findAtaPda(buyer.publicKey, depositCurrency);

  const startingSolBalance = await connection.getBalance(buyer.publicKey);

  const [treasuryEscrow] = findTreasuryEscrowPda(campaignUuid, sdk.programId);

  const startingTreasuryEscrowBalance = isTreasuryNative
    ? await connection.getBalance(treasuryEscrow)
    : await getTokenBalance(connection, treasuryEscrow);

  const [depositEscrowPda] = findDepositEscrowPda(
    campaignUuid,
    depositCurrency,
    sdk.programId
  );

  const startingDepositEscrowBalance = await connection.getBalance(
    depositEscrowPda
  );

  const startingDepositEscrowTokenBalance = await getTokenBalance(
    connection,
    depositEscrowPda
  );

  const startingTokenBalance = await getTokenBalance(
    connection,
    buyerSaleCurrencyAta
  );

  const tx = await sdk.createDepositTx(
    {
      depositor: buyer.publicKey,
      mint: masterEditionMint,
      saleCurrencyMint: depositCurrency,
    },
    {
      campaignUuid,
      depositAmount: new BN(depositAmount),
    }
  );

  const [depositRecordPda, depositRecordPdaBump] = findDepositRecordPda(
    buyer.publicKey,
    masterEditionMint,
    sdk.programId
  );

  const txid = await sendTransactionForTest(connection, tx, [buyer], {
    commitment: "confirmed",
  });

  // Assert deposit record account has the right owner.
  await expectAccountOwnedBy(connection, depositRecordPda, sdk.programId);
  if (!depositMatchesTreasury) {
    await expectAccountOwnedBy(
      connection,
      depositEscrowPda,
      isDepositNative ? SystemProgram.programId : TOKEN_PROGRAM_ID
    );
  }

  if (depositMatchesTreasury) {
    const accountInfo = await connection.getAccountInfo(depositEscrowPda);
    expect(accountInfo).toBe(null);
  }

  const endingTreasuryEscrowBalance = isTreasuryNative
    ? await connection.getBalance(treasuryEscrow)
    : await getTokenBalance(connection, treasuryEscrow);

  // Assert ending balances for buyer are correct.
  const endingSolBalance = await connection.getBalance(buyer.publicKey);

  const endingTokenBalance = await getTokenBalance(
    connection,
    buyerSaleCurrencyAta
  );

  const txCost = await getExpectedTransactionCost({
    connection,
    createdAccounts: isDepositNative
      ? [depositRecordPda]
      : [depositRecordPda, depositEscrowPda],
    txid,
  });

  const totalCostForBuyer = isDepositNative ? depositAmount + txCost : txCost;
  expectNumbersEqual(startingSolBalance - endingSolBalance, totalCostForBuyer);

  if (!isDepositNative) {
    expectNumbersEqual(startingTokenBalance, depositAmount);
    expectNumbersEqual(endingTokenBalance, 0);
  }

  // Assert balance changes for deposit record escrow account is correct.
  if (depositMatchesTreasury) {
    expectNumbersEqual(
      endingTreasuryEscrowBalance - startingTreasuryEscrowBalance,
      depositAmount
    );
  } else if (isDepositNative) {
    const endingDepositEscrowBalance = await connection.getBalance(
      depositEscrowPda
    );
    expectNumbersEqual(
      endingDepositEscrowBalance - startingDepositEscrowBalance,
      depositAmount
    );
  } else {
    const endingDepositEscrowTokenBalance = await getTokenBalance(
      connection,
      depositEscrowPda
    );
    expectNumbersEqual(
      endingDepositEscrowTokenBalance - startingDepositEscrowTokenBalance,
      depositAmount
    );
  }

  // Assert deposit record account data is correct.
  const depositRecord = await sdk.program.account.depositRecord.fetch(
    depositRecordPda
  );
  expectNumbersEqual(depositRecord.bump, depositRecordPdaBump);
  expectPublicKeysEqual(depositRecord.mint, masterEditionMint);
  expectPublicKeysEqual(depositRecord.depositEscrowMint, depositCurrency);
  expect(depositRecord.initialDepositAmount.toNumber()).toBe(depositAmount);

  // Assert escrow account changes are correct.
  const endingCampaignEscrowAccount =
    await sdk.fetchCampaignEscrowAccountWithCampaignUuid(campaignUuid);
  expectNumbersEqual(
    startingCampaignEscrowAccount.depositCount.add(new BN(1)),
    endingCampaignEscrowAccount.depositCount
  );

  if (depositMatchesTreasury) {
    expectNumbersEqual(
      endingCampaignEscrowAccount.treasury.totalFunds.sub(
        startingCampaignEscrowAccount.treasury.totalFunds
      ),
      depositAmount
    );
    expect(depositRecord.depositProcessed).toBe(true);
    expectNumbersEqual(depositRecord.processedDepositAmount, depositAmount);
    expectNumbersEqual(
      startingCampaignEscrowAccount.processedDepositCount.add(new BN(1)),
      endingCampaignEscrowAccount.processedDepositCount
    );
  } else {
    expectNumbersEqual(
      endingCampaignEscrowAccount.treasury.totalFunds.sub(
        startingCampaignEscrowAccount.treasury.totalFunds
      ),
      0
    );
    expect(depositRecord.depositProcessed).toBe(false);
    expectNumbersEqual(depositRecord.processedDepositAmount, 0);
    expectNumbersEqual(
      startingCampaignEscrowAccount.processedDepositCount.add(
        endingCampaignEscrowAccount.processedDepositCount
      ),
      startingCampaignEscrowAccount.processedDepositCount
    );
  }
}
