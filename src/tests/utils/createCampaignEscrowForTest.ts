import {
  convertUuidToPdaSeed,
  createSplToken,
  expectNumbersEqual,
  expectPublicKeysEqual,
  findAtaPda,
  isMintNative,
} from "@formfunction-hq/formfunction-program-shared";
import { NATIVE_MINT } from "@solana/spl-token";
import { Connection, Keypair } from "@solana/web3.js";
import CampaignTreasuryManagerSdk from "sdk/CampaignTreasuryManagerSdk";
import findTreasuryEscrowPda from "sdk/pdas/findTreasuryEscrowPda";
import CampaignEscrowSetupOptionsInput from "tests/types/CampaignEscrowSetupOptionsInput";
import CampaignEscrowTestSetupResult from "tests/types/CampaignEscrowTestSetupResult";
import comparePayoutPhasesForTest from "tests/utils/comparePayoutPhasesForTest";
import getCampaignEscrowInputForTest from "tests/utils/getCampaignEscrowInputForTest";
import sendTransactionForTest from "tests/utils/sendTransactionForTest";

export default async function createCampaignEscrowForTest(args: {
  authority: Keypair;
  connection: Connection;
  sdk: CampaignTreasuryManagerSdk;
  setupOptions?: CampaignEscrowSetupOptionsInput;
}): Promise<CampaignEscrowTestSetupResult> {
  const { authority, connection, sdk } = args;
  const {
    campaignUuid,
    createCampaignEscrowInput,
    depositEscrowCurrencies,
    setupOptions,
  } = await getCampaignEscrowInputForTest(
    connection,
    authority,
    args.setupOptions
  );

  const treasuryMint =
    setupOptions?.useNativeTreasury ?? true
      ? NATIVE_MINT
      : await createSplToken(connection, authority);

  const tx = await sdk.createEscrowTx(
    {
      authority: authority.publicKey,
      creator: setupOptions.creator.publicKey,
      payer: authority.publicKey,
      payoutWalletOwner: setupOptions.payoutWalletOwner,
      treasuryMint,
    },
    {
      campaignUuid,
      createCampaignEscrowInput,
    }
  );

  await sendTransactionForTest(connection, tx, [authority]);

  await Promise.all(
    depositEscrowCurrencies.map(async (depositEscrowMint) => {
      const createDepositEscrowTx = await sdk.createDepositEscrowTx(
        {
          depositEscrowMint,
        },
        {
          campaignUuid,
        }
      );

      await sendTransactionForTest(connection, createDepositEscrowTx, [
        authority,
      ]);
    })
  );

  const [campaignEscrow, bump] = await sdk.findCampaignEscrowPda(campaignUuid);

  const [treasuryEscrow] = findTreasuryEscrowPda(
    campaignUuid,
    sdk.program.programId
  );

  const campaignEscrowAccount = await sdk.fetchCampaignEscrowAccount(
    campaignEscrow
  );

  expect(campaignEscrowAccount.campaignUuid).toBe(
    convertUuidToPdaSeed(campaignUuid)
  );
  expect(campaignEscrowAccount.campaignEndTime.toNumber()).toBe(
    createCampaignEscrowInput.campaignEndTime.toNumber()
  );
  expect(campaignEscrowAccount.payoutsReady).toBe(false);
  expectNumbersEqual(campaignEscrowAccount.depositCount, 0);
  expectNumbersEqual(campaignEscrowAccount.processedDepositCount, 0);
  expectNumbersEqual(campaignEscrowAccount.treasury.totalFunds, 0);

  comparePayoutPhasesForTest(
    campaignEscrowAccount.payoutPhases,
    createCampaignEscrowInput.nonVotingPayoutPhases,
    createCampaignEscrowInput.votingPayoutPhases
  );

  expectNumbersEqual(campaignEscrowAccount.bump, bump);
  expectPublicKeysEqual(campaignEscrowAccount.authority, authority.publicKey);
  expectPublicKeysEqual(
    campaignEscrowAccount.creator,
    setupOptions.creator.publicKey
  );
  expectPublicKeysEqual(
    campaignEscrowAccount.treasury.treasuryEscrow,
    treasuryEscrow
  );
  expectPublicKeysEqual(
    campaignEscrowAccount.treasury.treasuryMint,
    treasuryMint
  );
  if (isMintNative(treasuryMint)) {
    expectPublicKeysEqual(
      campaignEscrowAccount.payoutWallet,
      setupOptions.payoutWalletOwner
    );
  } else {
    const [payoutWalletAta] = findAtaPda(
      setupOptions.payoutWalletOwner,
      treasuryMint
    );
    expectPublicKeysEqual(campaignEscrowAccount.payoutWallet, payoutWalletAta);
  }

  return {
    campaignEscrowAccount,
    createCampaignEscrowInput,
    depositEscrowCurrencies,
    ...setupOptions,
  };
}
