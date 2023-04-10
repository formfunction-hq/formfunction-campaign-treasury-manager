import createCampaignEscrowForTest from "tests/utils/createCampaignEscrowForTest";
import createDepositsForTest from "tests/utils/createDepositsForTest";
import getConnectionAndSdkForTest from "tests/utils/getConnectionAndSdkForTest";
import payoutFundsForTest from "tests/utils/payoutFundsForTest";

describe("Test PayOutFunds instruction.", () => {
  test("Funds can be paid out.", async () => {
    const { connection, authority, sdk } = await getConnectionAndSdkForTest();

    const setupResult = await createCampaignEscrowForTest({
      authority,
      connection,
      sdk,
    });
    const { campaignUuid } = setupResult;

    const depositAmountSol = 3;
    await createDepositsForTest({
      authority,
      campaignUuid,
      connection,
      depositAmounts: [depositAmountSol],
      depositCurrency: setupResult.campaignEscrowAccount.treasury.treasuryMint,
      sdk,
    });

    await payoutFundsForTest({
      authority,
      connection,
      sdk,
      setupResult,
    });
  });

  test.todo("Test payouts with multiple payout phases.");
});
