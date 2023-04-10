import { createSplToken } from "@formfunction-hq/formfunction-program-shared";
import { NATIVE_MINT } from "@solana/spl-token";
import createCampaignEscrowForTest from "tests/utils/createCampaignEscrowForTest";
import expectTransactionToFailWithErrorCode from "tests/utils/expectTransactionToFailWithErrorCode";
import getCampaignEscrowInputForTest from "tests/utils/getCampaignEscrowInputForTest";
import getConnectionAndSdkForTest from "tests/utils/getConnectionAndSdkForTest";
import sendTransactionForTest from "tests/utils/sendTransactionForTest";

describe("CreateEscrow instruction.", () => {
  test("A CampaignEscrow account with a native treasury can be created.", async () => {
    const { connection, authority, sdk } = await getConnectionAndSdkForTest();

    await createCampaignEscrowForTest({
      authority,
      connection,
      sdk,
    });
  });

  test("A CampaignEscrow account with an SPL token treasury can be created.", async () => {
    const { connection, authority, sdk } = await getConnectionAndSdkForTest();

    await createCampaignEscrowForTest({
      authority,
      connection,
      sdk,
      setupOptions: { useNativeTreasury: false },
    });
  });

  test("A CampaignEscrow account with a deposit escrow currencies can be created.", async () => {
    const { connection, authority, sdk } = await getConnectionAndSdkForTest();

    const numberOfCurrencies = 3;
    const { campaignEscrowAccount, depositEscrowCurrencies } =
      await createCampaignEscrowForTest({
        authority,
        connection,
        sdk,
        setupOptions: {
          enableDepositEscrowCurrencies: numberOfCurrencies,
          useNativeTreasury: false,
        },
      });

    expect(campaignEscrowAccount.depositEscrowInfos.length).toBe(
      numberOfCurrencies
    );
    for (const currency of depositEscrowCurrencies) {
      const campaignEscrowCurrency =
        campaignEscrowAccount.depositEscrowInfos.find(
          (val) => val.mint.toString() === currency.toString()
        );
      expect(campaignEscrowCurrency).toBeDefined();
      expect(campaignEscrowCurrency?.depositEscrowBump).toBeDefined();
    }
  });

  test("Authority must sign the CreateEscrow instruction if creator did not sign.", async () => {
    const { connection, authority, otherKeypair, sdk } =
      await getConnectionAndSdkForTest();

    const {
      campaignUuid,
      createCampaignEscrowInput,
      setupOptions: { creator },
    } = await getCampaignEscrowInputForTest(connection, authority);
    const treasuryMint = NATIVE_MINT;

    const tx = await sdk.createEscrowTx(
      {
        authority: otherKeypair.publicKey,
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
      errorName: "MissingSigner",
      signers: [authority],
      transaction: tx,
    });
  });

  test("Creator must sign the CreateEscrow instruction if authority did not sign.", async () => {
    const {
      connection,
      authority,
      creatorKeypair,
      otherKeypair: payer,
      sdk,
    } = await getConnectionAndSdkForTest();

    const treasuryMint = await createSplToken(connection, authority);

    const { campaignUuid, createCampaignEscrowInput } =
      await getCampaignEscrowInputForTest(connection, authority, {
        creatorKeypair,
      });

    const expectToFailTx = await sdk.createEscrowTx(
      {
        authority: authority.publicKey,
        creator: creatorKeypair.publicKey,
        payer: payer.publicKey,
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
      errorName: "MissingSigner",
      signers: [payer],
      transaction: expectToFailTx,
    });

    const expectToSucceedTx = await sdk.createEscrowTx(
      {
        authority: authority.publicKey,
        creator: creatorKeypair.publicKey,
        payer: creatorKeypair.publicKey,
        payoutWalletOwner: authority.publicKey,
        treasuryMint,
      },
      {
        campaignUuid,
        createCampaignEscrowInput,
      }
    );

    await sendTransactionForTest(connection, expectToSucceedTx, [
      creatorKeypair,
    ]);
  });
});
