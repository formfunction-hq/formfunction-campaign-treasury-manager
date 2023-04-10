import { NATIVE_MINT } from "@solana/spl-token";
import CreateCampaignEscrowInput from "sdk/types/CreateCampaignEscrowInput";
import UpdateCampaignEscrowInput from "sdk/types/UpdateCampaignEscrowInput";
import expectTransactionToFailWithErrorCode from "tests/utils/expectTransactionToFailWithErrorCode";
import getConnectionAndSdkForTest from "tests/utils/getConnectionAndSdkForTest";
import getDefaultCampaignSetupOptions from "tests/utils/getDefaultCampaignSetupOptions";
import getSecondsAheadUnixTime from "tests/utils/getSecondsAheadUnixTime";
import getPayoutPhasesForTest from "tests/utils/payout-phases/getPayoutPhasesForTest";
import sendTransactionForTest from "tests/utils/sendTransactionForTest";

describe("Test PayoutPhases create and update validation.", () => {
  const { valid, invalid } = getPayoutPhasesForTest();
  const validTestLabels = valid.map((val) => val.label);
  const invalidTestLabels = invalid.map((val) => val.label);

  test.each(validTestLabels)(
    "PayoutPhases test valid case: %s",
    async (testCaseLabel) => {
      const { connection, authority, sdk } = await getConnectionAndSdkForTest();

      const treasuryMint = NATIVE_MINT;
      const options = getDefaultCampaignSetupOptions(treasuryMint);

      const { label: _, ...payoutPhases } = getPayoutPhasesForTest().valid.find(
        (testCase) => testCase.label === testCaseLabel
      )!;

      const createCampaignEscrowInput: CreateCampaignEscrowInput = {
        ...payoutPhases,
        campaignEndTime: getSecondsAheadUnixTime(3),
      };

      const { campaignUuid, creator } = options;
      const createTx = await sdk.createEscrowTx(
        {
          authority: authority.publicKey,
          creator: creator.publicKey,
          payer: authority.publicKey,
          payoutWalletOwner: authority.publicKey,
          treasuryMint,
        },
        {
          campaignUuid,
          createCampaignEscrowInput,
        }
      );

      await sendTransactionForTest(connection, createTx, [authority]);

      const updateCampaignEscrowInput: UpdateCampaignEscrowInput = {
        ...payoutPhases,
        authority: null,
        campaignEndTime: null,
        creator: null,
      };

      const updateTx = await sdk.updateEscrowTx(
        {
          authority: authority.publicKey,
          creator: creator.publicKey,
          payer: authority.publicKey,
          payoutWalletOwner: authority.publicKey,
          treasuryMint,
        },
        {
          campaignUuid,
          updateCampaignEscrowInput,
        }
      );

      await sendTransactionForTest(connection, updateTx, [authority]);
    }
  );

  test.each(invalidTestLabels)(
    "PayoutPhases test invalid case: %s",
    async (testCaseLabel) => {
      const { connection, authority, sdk } = await getConnectionAndSdkForTest();

      const treasuryMint = NATIVE_MINT;
      const options = getDefaultCampaignSetupOptions(treasuryMint);

      const { label: _, ...payoutPhases } =
        getPayoutPhasesForTest().invalid.find(
          (testCase) => testCase.label === testCaseLabel
        )!;

      const createCampaignEscrowInput: CreateCampaignEscrowInput = {
        ...payoutPhases,
        campaignEndTime: getSecondsAheadUnixTime(4),
      };

      const { campaignUuid, creator } = options;
      const invalidCreateTx = await sdk.createEscrowTx(
        {
          authority: authority.publicKey,
          creator: creator.publicKey,
          payer: authority.publicKey,
          payoutWalletOwner: authority.publicKey,
          treasuryMint,
        },
        {
          campaignUuid,
          createCampaignEscrowInput,
        }
      );

      await expectTransactionToFailWithErrorCode({
        connection,
        errorName: "InvalidPayoutPhases",
        signers: [authority],
        transaction: invalidCreateTx,
      });

      const validInput: CreateCampaignEscrowInput = {
        ...getPayoutPhasesForTest().valid[0],
        campaignEndTime: getSecondsAheadUnixTime(3),
      };

      const validCreateTx = await sdk.createEscrowTx(
        {
          authority: authority.publicKey,
          creator: creator.publicKey,
          payer: authority.publicKey,
          payoutWalletOwner: authority.publicKey,
          treasuryMint,
        },
        {
          campaignUuid,
          createCampaignEscrowInput: validInput,
        }
      );

      await sendTransactionForTest(connection, validCreateTx, [authority]);

      const updateCampaignEscrowInput: UpdateCampaignEscrowInput = {
        ...payoutPhases,
        authority: null,
        campaignEndTime: null,
        creator: null,
      };

      const invalidUpdateTx = await sdk.updateEscrowTx(
        {
          authority: authority.publicKey,
          creator: creator.publicKey,
          payer: authority.publicKey,
          payoutWalletOwner: authority.publicKey,
          treasuryMint,
        },
        {
          campaignUuid,
          updateCampaignEscrowInput,
        }
      );

      await expectTransactionToFailWithErrorCode({
        connection,
        errorName: "InvalidPayoutPhases",
        signers: [authority],
        transaction: invalidUpdateTx,
      });
    }
  );
});
