import {
  createSplToken,
  expectPublicKeysEqual,
} from "@formfunction-hq/formfunction-program-shared";
import { NATIVE_MINT } from "@solana/spl-token";
import UpdateCampaignEscrowInput from "sdk/types/UpdateCampaignEscrowInput";
import createCampaignEscrowForTest from "tests/utils/createCampaignEscrowForTest";
import expectTransactionToFailWithErrorCode from "tests/utils/expectTransactionToFailWithErrorCode";
import getConnectionAndSdkForTest from "tests/utils/getConnectionAndSdkForTest";
import getSecondsAheadUnixTime from "tests/utils/getSecondsAheadUnixTime";
import sendTransactionForTest from "tests/utils/sendTransactionForTest";
import updateCampaignEscrowForTest from "tests/utils/updateCampaignEscrowForTest";

describe("UpdateEscrow instruction.", () => {
  test("The authority can update the CampaignEscrow.", async () => {
    const { connection, authority, sdk } = await getConnectionAndSdkForTest();
    const { campaignEscrowAccount, creator, payoutWalletOwner } =
      await createCampaignEscrowForTest({
        authority,
        connection,
        sdk,
      });

    const updateCampaignEscrowInput: UpdateCampaignEscrowInput = {
      authority: null,
      campaignEndTime: getSecondsAheadUnixTime(6),
      creator: creator.publicKey,
      nonVotingPayoutPhases: null,
      votingPayoutPhases: null,
    };

    await updateCampaignEscrowForTest({
      authority,
      campaignEscrowAccount,
      connection,
      payoutWalletOwner,
      sdk,
      updateCampaignEscrowInput,
      useNativeTreasury: true,
    });
  });

  test("UpdateEscrow can update the CampaignEscrow Treasury from native to non-native.", async () => {
    const {
      connection,
      authority,
      otherKeypair: wallet,
      sdk,
    } = await getConnectionAndSdkForTest();

    const { campaignEscrowAccount, creator, campaignUuid } =
      await createCampaignEscrowForTest({
        authority,
        connection,
        sdk,
      });

    expectPublicKeysEqual(
      campaignEscrowAccount.treasury.treasuryMint,
      NATIVE_MINT
    );

    const updateCampaignEscrowInput: UpdateCampaignEscrowInput = {
      authority: null,
      campaignEndTime: getSecondsAheadUnixTime(5),
      creator: creator.publicKey,
      nonVotingPayoutPhases: null,
      votingPayoutPhases: null,
    };

    const treasuryMint = await createSplToken(connection, authority);

    const tx = await sdk.updateEscrowTx(
      {
        authority: authority.publicKey,
        creator: creator.publicKey,
        payer: authority.publicKey,
        payoutWalletOwner: wallet.publicKey,
        treasuryMint,
      },
      {
        campaignUuid: campaignEscrowAccount.campaignUuid,
        updateCampaignEscrowInput,
      }
    );

    await sendTransactionForTest(connection, tx, [authority]);

    const [campaignEscrow] = await sdk.findCampaignEscrowPda(campaignUuid);
    const updatedCampaignEscrowAccount = await sdk.fetchCampaignEscrowAccount(
      campaignEscrow
    );

    expectPublicKeysEqual(
      updatedCampaignEscrowAccount.treasury.treasuryMint,
      treasuryMint
    );
  });

  test("UpdateEscrow can update the CampaignEscrow Treasury from non-native to native.", async () => {
    const {
      connection,
      authority,
      otherKeypair: wallet,
      sdk,
    } = await getConnectionAndSdkForTest();

    const { campaignEscrowAccount, creator, campaignUuid } =
      await createCampaignEscrowForTest({
        authority,
        connection,
        sdk,
        setupOptions: { useNativeTreasury: false },
      });

    expect(campaignEscrowAccount.treasury.treasuryMint.toString()).not.toBe(
      NATIVE_MINT.toString()
    );

    const updateCampaignEscrowInput: UpdateCampaignEscrowInput = {
      authority: null,
      campaignEndTime: getSecondsAheadUnixTime(8),
      creator: creator.publicKey,
      nonVotingPayoutPhases: null,
      votingPayoutPhases: null,
    };

    const treasuryMint = NATIVE_MINT;

    const tx = await sdk.updateEscrowTx(
      {
        authority: authority.publicKey,
        creator: creator.publicKey,
        payer: authority.publicKey,
        payoutWalletOwner: wallet.publicKey,
        treasuryMint,
      },
      {
        campaignUuid: campaignEscrowAccount.campaignUuid,
        updateCampaignEscrowInput,
      }
    );

    await sendTransactionForTest(connection, tx, [authority]);

    const [campaignEscrow] = await sdk.findCampaignEscrowPda(campaignUuid);
    const updatedCampaignEscrowAccount = await sdk.fetchCampaignEscrowAccount(
      campaignEscrow
    );

    expectPublicKeysEqual(
      updatedCampaignEscrowAccount.treasury.treasuryMint,
      treasuryMint
    );
  });

  test("Authority must sign the UpdateEscrow instruction if creator did not sign.", async () => {
    const { connection, authority, otherKeypair, sdk } =
      await getConnectionAndSdkForTest();

    const { campaignEscrowAccount, creator } =
      await createCampaignEscrowForTest({
        authority,
        connection,
        sdk,
      });

    const updateCampaignEscrowInput: UpdateCampaignEscrowInput = {
      authority: null,
      campaignEndTime: getSecondsAheadUnixTime(4),
      creator: creator.publicKey,
      nonVotingPayoutPhases: null,
      votingPayoutPhases: null,
    };

    const tx = await sdk.updateEscrowTx(
      {
        authority: otherKeypair.publicKey,
        creator: creator.publicKey,
        payer: otherKeypair.publicKey,
        payoutWalletOwner: authority.publicKey,
        treasuryMint: NATIVE_MINT,
      },
      {
        campaignUuid: campaignEscrowAccount.campaignUuid,
        updateCampaignEscrowInput,
      }
    );

    await expectTransactionToFailWithErrorCode({
      connection,
      errorName: "ConstraintHasOne",
      signers: [otherKeypair],
      transaction: tx,
    });
  });

  test("If only the creator signs the UpdateEscrow instruction should fail.", async () => {
    const { connection, authority, creatorKeypair, sdk } =
      await getConnectionAndSdkForTest();

    const { campaignEscrowAccount, creator } =
      await createCampaignEscrowForTest({
        authority,
        connection,
        sdk,
        setupOptions: { creatorKeypair },
      });

    const updateCampaignEscrowInput: UpdateCampaignEscrowInput = {
      authority: null,
      campaignEndTime: getSecondsAheadUnixTime(5),
      creator: creator.publicKey,
      nonVotingPayoutPhases: null,
      votingPayoutPhases: null,
    };

    const tx = await sdk.updateEscrowTx(
      {
        authority: authority.publicKey,
        creator: creator.publicKey,
        payer: creator.publicKey,
        payoutWalletOwner: authority.publicKey,
        treasuryMint: NATIVE_MINT,
      },
      {
        campaignUuid: campaignEscrowAccount.campaignUuid,
        updateCampaignEscrowInput,
      }
    );

    await expectTransactionToFailWithErrorCode({
      connection,
      errorName: "SignatureVerificationFailed",
      signers: [creator],
      transaction: tx,
    });
  });
});
