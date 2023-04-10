import {
  createSplToken,
  expectNumbersEqual,
  expectPublicKeysEqual,
  findAtaPda,
  isMintNative,
} from "@formfunction-hq/formfunction-program-shared";
import { NATIVE_MINT } from "@solana/spl-token";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import CampaignTreasuryManagerSdk from "sdk/CampaignTreasuryManagerSdk";
import findCampaignEscrowPda from "sdk/pdas/findCampaignEscrowPda";
import CampaignEscrowAccount from "sdk/types/CampaignEscrowAccount";
import UpdateCampaignEscrowInput from "sdk/types/UpdateCampaignEscrowInput";
import comparePayoutPhasesForTest from "tests/utils/comparePayoutPhasesForTest";
import sendTransactionForTest from "tests/utils/sendTransactionForTest";

export default async function updateCampaignEscrowForTest({
  authority,
  campaignEscrowAccount,
  connection,
  payoutWalletOwner,
  sdk,
  updateCampaignEscrowInput,
  useNativeTreasury,
}: {
  authority: Keypair;
  campaignEscrowAccount: CampaignEscrowAccount;
  connection: Connection;
  payoutWalletOwner: PublicKey;
  sdk: CampaignTreasuryManagerSdk;
  updateCampaignEscrowInput: UpdateCampaignEscrowInput;
  useNativeTreasury: boolean;
}): Promise<CampaignEscrowAccount> {
  const campaignUuid = campaignEscrowAccount.campaignUuid;

  const treasuryMint =
    useNativeTreasury ?? true
      ? NATIVE_MINT
      : await createSplToken(connection, authority);

  const tx = await sdk.updateEscrowTx(
    {
      authority: campaignEscrowAccount.authority,
      creator: campaignEscrowAccount.creator,
      payer: authority.publicKey,
      payoutWalletOwner,
      treasuryMint,
    },
    {
      campaignUuid,
      updateCampaignEscrowInput,
    }
  );

  await sendTransactionForTest(connection, tx, [authority]);

  const [campaignEscrowAddress] = findCampaignEscrowPda(
    campaignUuid,
    sdk.programId
  );

  const updatedCampaignEscrow = await sdk.fetchCampaignEscrowAccount(
    campaignEscrowAddress
  );

  const {
    campaignEndTime,
    creator,
    nonVotingPayoutPhases,
    votingPayoutPhases,
  } = updateCampaignEscrowInput;

  if (updateCampaignEscrowInput.authority != null) {
    expectPublicKeysEqual(
      updatedCampaignEscrow.authority,
      updateCampaignEscrowInput.authority
    );
  }

  if (creator != null) {
    expectPublicKeysEqual(updatedCampaignEscrow.creator, creator);
  }

  if (campaignEndTime != null) {
    expect(updatedCampaignEscrow.campaignEndTime.toNumber()).toBe(
      campaignEndTime.toNumber()
    );
  }

  if (nonVotingPayoutPhases != null || votingPayoutPhases != null) {
    comparePayoutPhasesForTest(
      updatedCampaignEscrow.payoutPhases,
      nonVotingPayoutPhases ?? [],
      votingPayoutPhases ?? []
    );
  }

  expectPublicKeysEqual(
    updatedCampaignEscrow.treasury.treasuryMint,
    treasuryMint
  );

  if (isMintNative(treasuryMint)) {
    expectPublicKeysEqual(
      updatedCampaignEscrow.payoutWallet,
      payoutWalletOwner
    );
  } else {
    const [payoutWalletAta] = findAtaPda(payoutWalletOwner, treasuryMint);
    expectPublicKeysEqual(updatedCampaignEscrow.payoutWallet, payoutWalletAta);
  }

  // These fields cannot be updated, and should still be in the pre-update state.
  expect(updatedCampaignEscrow.payoutsReady).toBe(
    campaignEscrowAccount.payoutsReady
  );
  expectNumbersEqual(
    updatedCampaignEscrow.depositCount,
    campaignEscrowAccount.depositCount
  );
  expectNumbersEqual(
    updatedCampaignEscrow.processedDepositCount,
    campaignEscrowAccount.processedDepositCount
  );
  expectNumbersEqual(
    updatedCampaignEscrow.treasury.totalFunds,
    campaignEscrowAccount.treasury.totalFunds
  );

  return updatedCampaignEscrow;
}
