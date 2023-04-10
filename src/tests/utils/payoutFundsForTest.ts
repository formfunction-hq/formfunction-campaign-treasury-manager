import {
  expectNumbersEqual,
  getTokenBalance,
  isMintNative,
} from "@formfunction-hq/formfunction-program-shared";
import { Connection, Keypair } from "@solana/web3.js";
import dayjs from "dayjs";
import CampaignTreasuryManagerSdk from "sdk/CampaignTreasuryManagerSdk";
import findTreasuryEscrowPda from "sdk/pdas/findTreasuryEscrowPda";
import getCurrentActivePayoutPhase from "sdk/utils/getCurrentActivePayoutPhase";
import CampaignEscrowTestSetupResult from "tests/types/CampaignEscrowTestSetupResult";
import expectTransactionToFailWithErrorCode from "tests/utils/expectTransactionToFailWithErrorCode";
import sendTransactionForTest from "tests/utils/sendTransactionForTest";
import waitMinDelayForTimeBuffer from "tests/utils/waitMinDelayForTimeBuffer";

type PayoutResult = {
  payoutAmount: number;
};

// TODO[@bonham000]: Calculate expected payout from on-chain payout phases data.
export default async function payoutFundsForTest(args: {
  authority: Keypair;
  connection: Connection;
  sdk: CampaignTreasuryManagerSdk;
  setupResult: CampaignEscrowTestSetupResult;
}): Promise<PayoutResult> {
  const { authority, connection, sdk, setupResult } = args;
  const { campaignUuid } = setupResult;

  const [treasuryEscrow] = findTreasuryEscrowPda(
    campaignUuid,
    sdk.program.programId
  );

  const payoutWallet = setupResult.campaignEscrowAccount.payoutWallet;

  const isTreasuryNative = isMintNative(
    setupResult.campaignEscrowAccount.treasury.treasuryMint
  );

  const startingPayoutWalletBalance = isTreasuryNative
    ? await connection.getBalance(payoutWallet)
    : await getTokenBalance(connection, payoutWallet);

  const startingTreasuryBalance = isTreasuryNative
    ? await connection.getBalance(treasuryEscrow)
    : await getTokenBalance(connection, treasuryEscrow);

  const transaction = await sdk.payOutFundsTx(
    {
      payer: authority.publicKey,
    },
    {
      campaignUuid,
    }
  );

  // Should fail because of payout time violation.
  await expectTransactionToFailWithErrorCode({
    connection,
    errorName: "InvalidPayoutRequest",
    signers: [authority],
    transaction,
  });

  const payoutPhase = getCurrentActivePayoutPhase(
    setupResult.campaignEscrowAccount.payoutPhases
  );
  const payoutTime = payoutPhase!.sharedFields.payoutTime.toNumber();
  const minDelay = payoutTime - dayjs().unix();
  await waitMinDelayForTimeBuffer(minDelay);

  await sendTransactionForTest(connection, transaction, [authority]);

  const endingPayoutWalletBalance = isTreasuryNative
    ? await connection.getBalance(payoutWallet)
    : await getTokenBalance(connection, payoutWallet);

  const endingTreasuryBalance = isTreasuryNative
    ? await connection.getBalance(treasuryEscrow)
    : await getTokenBalance(connection, treasuryEscrow);

  const payoutAmount = startingTreasuryBalance - endingTreasuryBalance;

  expectNumbersEqual(
    payoutAmount,
    endingPayoutWalletBalance - startingPayoutWalletBalance
  );

  return { payoutAmount };
}
