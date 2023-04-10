import dayjs from "dayjs";
import findCampaignEscrowPda from "sdk/pdas/findCampaignEscrowPda";
import getPayoutPhasesOrderedArray from "sdk/utils/getPayoutPhasesOrderedArray";
import createCampaignEscrowForTest from "tests/utils/createCampaignEscrowForTest";
import createDepositsForTest from "tests/utils/createDepositsForTest";
import expectTransactionToFailWithErrorCode from "tests/utils/expectTransactionToFailWithErrorCode";
import getConnectionAndSdkForTest from "tests/utils/getConnectionAndSdkForTest";
import getDefaultCampaignEndTimeForTest from "tests/utils/getDefaultCampaignEndTimeForTest";
import getDefaultNonVotingSharedFields from "tests/utils/payout-phases/getDefaultNonVotingSharedFields";
import getSecondsAfterCampaignEndTime from "tests/utils/payout-phases/getSecondsAfterCampaignEndTime";
import payoutFundsForTest from "tests/utils/payoutFundsForTest";
import sendTransactionForTest from "tests/utils/sendTransactionForTest";
import waitMinDelayForTimeBuffer from "tests/utils/waitMinDelayForTimeBuffer";

describe("CloseEscrow instruction.", () => {
  test("Cannot close escrow before final payout phase refund deadline.", async () => {
    const { connection, authority, sdk } = await getConnectionAndSdkForTest();

    const setupResult = await createCampaignEscrowForTest({
      authority,
      connection,
      sdk,
      setupOptions: {
        payoutPhases: {
          nonVotingPayoutPhases: [
            {
              sharedFields: {
                ...getDefaultNonVotingSharedFields(),
                refundDeadline: getSecondsAfterCampaignEndTime(
                  getDefaultCampaignEndTimeForTest(),
                  15
                ),
              },
            },
          ],
          votingPayoutPhases: [],
        },
      },
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

    const transaction = await sdk.closeEscrowTx(
      {
        authority: authority.publicKey,
        creator: setupResult.creator.publicKey,
        payer: authority.publicKey,
        receiver: authority.publicKey,
      },
      {
        campaignUuid,
      }
    );

    // Should fail because of min time violation.
    await expectTransactionToFailWithErrorCode({
      connection,
      errorName: "InvalidCloseEscrow",
      signers: [authority],
      transaction,
    });
  });

  test("The CampaignEscrow authority can close the CampaignEscrow account if all payouts are complete.", async () => {
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

    const transaction = await sdk.closeEscrowTx(
      {
        authority: authority.publicKey,
        creator: setupResult.creator.publicKey,
        payer: authority.publicKey,
        receiver: authority.publicKey,
      },
      {
        campaignUuid,
      }
    );

    const nextActivePayoutPhase = getPayoutPhasesOrderedArray(
      setupResult.campaignEscrowAccount.payoutPhases
    )[0];

    const refundDeadlineTime =
      nextActivePayoutPhase!.sharedFields.refundDeadline;
    const minDelay = refundDeadlineTime.toNumber() - dayjs().unix();
    await waitMinDelayForTimeBuffer(minDelay);

    await sendTransactionForTest(connection, transaction, [authority]);

    const [campaignEscrow] = findCampaignEscrowPda(campaignUuid, sdk.programId);
    const campaignEscrowAccount = await connection.getAccountInfo(
      campaignEscrow
    );
    const treasuryEscrowAccount = await connection.getAccountInfo(
      setupResult.campaignEscrowAccount.treasury.treasuryEscrow
    );
    expect(campaignEscrowAccount).toBe(null);
    expect(treasuryEscrowAccount).toBe(null);
  });

  test.todo(
    "DepositEscrow accounts must be closed before the CloseEscrow can be called."
  );

  test("The CampaignEscrow account cannot be closed if unless all payouts have been completed.", async () => {
    const { connection, authority, sdk } = await getConnectionAndSdkForTest();

    const { campaignEscrowAccount, creator } =
      await createCampaignEscrowForTest({
        authority,
        connection,
        sdk,
      });

    const tx = await sdk.closeEscrowTx(
      {
        authority: authority.publicKey,
        creator: creator.publicKey,
        payer: authority.publicKey,
        receiver: authority.publicKey,
      },
      {
        campaignUuid: campaignEscrowAccount.campaignUuid,
      }
    );

    await expectTransactionToFailWithErrorCode({
      connection,
      errorName: "InvalidCloseEscrow",
      signers: [authority],
      transaction: tx,
    });
  });

  test("Other keypairs cannot close the CampaignEscrow account.", async () => {
    const { connection, authority, otherKeypair, sdk } =
      await getConnectionAndSdkForTest();

    const { campaignEscrowAccount, creator } =
      await createCampaignEscrowForTest({
        authority,
        connection,
        sdk,
      });

    const tx = await sdk.closeEscrowTx(
      {
        authority: authority.publicKey,
        creator: creator.publicKey,
        payer: otherKeypair.publicKey,
        receiver: authority.publicKey,
      },
      {
        campaignUuid: campaignEscrowAccount.campaignUuid,
      }
    );

    await expectTransactionToFailWithErrorCode({
      connection,
      errorName: "SignatureVerificationFailed",
      signers: [otherKeypair],
      transaction: tx,
    });
  });
});
