import {
  arePublicKeysEqual,
  expectNumbersEqual,
  forEachAsync,
  fundSplTokenAtas,
  generateKeypairArray,
  mintMasterEditionForTest,
  requestAirdrops,
  solToLamports,
  sumArray,
} from "@formfunction-hq/formfunction-program-shared";
import { NATIVE_MINT } from "@solana/spl-token";
import createCampaignEscrowForTest from "tests/utils/createCampaignEscrowForTest";
import createDepositForTest from "tests/utils/createDepositForTest";
import expectTransactionToFailWithErrorCode from "tests/utils/expectTransactionToFailWithErrorCode";
import getConnectionAndSdkForTest from "tests/utils/getConnectionAndSdkForTest";
import sendTransactionForTest from "tests/utils/sendTransactionForTest";

describe("CreateDeposit instruction.", () => {
  test("Deposits can be created with a native sale currency which matches the treasury currency.", async () => {
    const { connection, authority, sdk } = await getConnectionAndSdkForTest();

    const { campaignUuid } = await createCampaignEscrowForTest({
      authority,
      connection,
      sdk,
    });

    const depositAmounts = [1, 3, 2, 5, 8];
    const totalDepositAmount = solToLamports(sumArray(depositAmounts));
    const buyers = generateKeypairArray(depositAmounts.length);
    await requestAirdrops({
      connection,
      wallets: buyers,
    });

    await forEachAsync(buyers, async (buyer, index) => {
      const masterEditionMint = await mintMasterEditionForTest(
        buyer,
        connection
      );
      const depositAmount = depositAmounts[index];
      await createDepositForTest({
        buyer,
        campaignUuid,
        connection,
        depositAmount: solToLamports(depositAmount),
        depositCurrency: NATIVE_MINT,
        masterEditionMint,
        sdk,
      });
    });

    const campaignEscrowAccount =
      await sdk.fetchCampaignEscrowAccountWithCampaignUuid(campaignUuid);

    expectNumbersEqual(
      campaignEscrowAccount.depositCount,
      depositAmounts.length
    );
    expectNumbersEqual(
      campaignEscrowAccount.processedDepositCount,
      depositAmounts.length
    );
    expectNumbersEqual(
      campaignEscrowAccount.treasury.totalFunds,
      totalDepositAmount
    );
  });

  test("Deposits can be created with a non-native sale currency which does not match the treasury currency.", async () => {
    const { connection, authority, sdk } = await getConnectionAndSdkForTest();

    const { campaignUuid, depositEscrowCurrencies } =
      await createCampaignEscrowForTest({
        authority,
        connection,
        sdk,
        setupOptions: { enableDepositEscrowCurrencies: 1 },
      });

    const depositCurrency = depositEscrowCurrencies[0];

    const depositAmounts = [10, 50, 32, 18, 95];
    const buyers = generateKeypairArray(depositAmounts.length);
    await requestAirdrops({
      connection,
      wallets: buyers,
    });

    await forEachAsync(buyers, async (buyerKeypair, index) => {
      const masterEditionMint = await mintMasterEditionForTest(
        buyerKeypair,
        connection
      );
      const depositAmount = depositAmounts[index];
      await fundSplTokenAtas(
        connection,
        [buyerKeypair.publicKey],
        depositCurrency,
        authority,
        depositAmount
      );

      await createDepositForTest({
        buyer: buyerKeypair,
        campaignUuid,
        connection,
        depositAmount,
        depositCurrency,
        masterEditionMint,
        sdk,
      });
    });

    const campaignEscrowAccount =
      await sdk.fetchCampaignEscrowAccountWithCampaignUuid(campaignUuid);

    expectNumbersEqual(
      campaignEscrowAccount.depositCount,
      depositAmounts.length
    );
    expectNumbersEqual(campaignEscrowAccount.processedDepositCount, 0);
    expectNumbersEqual(campaignEscrowAccount.treasury.totalFunds, 0);
  });

  test("Deposits can be created for a non-native escrow treasury with a native deposit escrow.", async () => {
    const { connection, authority, sdk } = await getConnectionAndSdkForTest();

    const { campaignUuid } = await createCampaignEscrowForTest({
      authority,
      connection,
      sdk,
      setupOptions: {
        enableDepositEscrowCurrencies: 1,
        useNativeDepositEscrow: true,
        useNativeTreasury: false,
      },
    });

    const depositCurrency = NATIVE_MINT;

    const depositAmounts = [20, 8, 32, 9, 11];
    const buyers = generateKeypairArray(depositAmounts.length);
    await requestAirdrops({
      connection,
      wallets: buyers,
    });

    await forEachAsync(buyers, async (buyerKeypair, index) => {
      const masterEditionMint = await mintMasterEditionForTest(
        buyerKeypair,
        connection
      );
      const depositAmount = solToLamports(depositAmounts[index]);
      await createDepositForTest({
        buyer: buyerKeypair,
        campaignUuid,
        connection,
        depositAmount,
        depositCurrency,
        masterEditionMint,
        sdk,
      });
    });

    const campaignEscrowAccount =
      await sdk.fetchCampaignEscrowAccountWithCampaignUuid(campaignUuid);

    expect(
      arePublicKeysEqual(
        campaignEscrowAccount.treasury.treasuryMint,
        NATIVE_MINT
      )
    ).toBe(false);
    expect(
      campaignEscrowAccount.depositEscrowInfos.some((val) =>
        arePublicKeysEqual(val.mint, NATIVE_MINT)
      )
    ).toBe(true);
    expectNumbersEqual(
      campaignEscrowAccount.depositCount,
      depositAmounts.length
    );
    expectNumbersEqual(campaignEscrowAccount.processedDepositCount, 0);
    expectNumbersEqual(campaignEscrowAccount.treasury.totalFunds, 0);
  });

  test("CreateDepositEscrow requires the CampaignEscrow authority as a signer.", async () => {
    const { connection, authority, otherKeypair, sdk } =
      await getConnectionAndSdkForTest();

    const { campaignUuid } = await createCampaignEscrowForTest({
      authority,
      connection,
      sdk,
      setupOptions: {
        enableDepositEscrowCurrencies: 1,
        useNativeTreasury: true,
      },
    });

    const transaction = await sdk.createDepositEscrowTx(
      {
        depositEscrowMint: NATIVE_MINT,
      },
      {
        campaignUuid,
      }
    );

    await expectTransactionToFailWithErrorCode({
      connection,
      errorName: "SignatureVerificationFailed",
      signers: [otherKeypair],
      transaction,
    });
  });

  test("Cannot set treasury and deposit escrow both as the native mint.", async () => {
    const { connection, authority, sdk } = await getConnectionAndSdkForTest();

    const { campaignUuid } = await createCampaignEscrowForTest({
      authority,
      connection,
      sdk,
      setupOptions: {
        enableDepositEscrowCurrencies: 1,
        useNativeTreasury: true,
      },
    });

    const transaction = await sdk.createDepositEscrowTx(
      {
        depositEscrowMint: NATIVE_MINT,
      },
      {
        campaignUuid,
      }
    );

    await expectTransactionToFailWithErrorCode({
      connection,
      errorName: "InvalidCreateDepositEscrowIx",
      signers: [authority],
      transaction,
    });
  });

  test("Cannot set treasury and deposit escrow both as the non-native mint.", async () => {
    const { connection, authority, sdk } = await getConnectionAndSdkForTest();

    const { campaignUuid, campaignEscrowAccount } =
      await createCampaignEscrowForTest({
        authority,
        connection,
        sdk,
        setupOptions: {
          enableDepositEscrowCurrencies: 1,
          useNativeTreasury: false,
        },
      });

    const depositEscrowMint = campaignEscrowAccount.treasury.treasuryMint;

    const transaction = await sdk.createDepositEscrowTx(
      {
        depositEscrowMint,
      },
      {
        campaignUuid,
      }
    );

    await expectTransactionToFailWithErrorCode({
      connection,
      errorName: "InvalidCreateDepositEscrowIx",
      signers: [authority],
      transaction,
    });
  });

  test("Setting a deposit escrow currency twice is a no-op.", async () => {
    const { connection, authority, sdk } = await getConnectionAndSdkForTest();

    const { campaignUuid, depositEscrowCurrencies } =
      await createCampaignEscrowForTest({
        authority,
        connection,
        sdk,
        setupOptions: {
          enableDepositEscrowCurrencies: 1,
        },
      });

    const depositEscrowMint = depositEscrowCurrencies[0];

    const tx = await sdk.createDepositEscrowTx(
      {
        depositEscrowMint,
      },
      {
        campaignUuid,
      }
    );

    await sendTransactionForTest(connection, tx, [authority]);

    const campaignEscrowAccount =
      await sdk.fetchCampaignEscrowAccountWithCampaignUuid(campaignUuid);

    expect(campaignEscrowAccount.depositEscrowInfos.length).toBe(1);
    expect(
      arePublicKeysEqual(
        campaignEscrowAccount.depositEscrowInfos[0].mint,
        depositEscrowMint
      )
    ).toBe(true);
  });
});
