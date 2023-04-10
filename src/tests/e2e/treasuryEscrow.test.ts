import {
  createSplToken,
  findAtaPda,
  isMintNative,
  ixToTx,
} from "@formfunction-hq/formfunction-program-shared";
import { NATIVE_MINT } from "@solana/spl-token";
import { Keypair, PublicKey } from "@solana/web3.js";
import { CampaignTreasuryManagerProgram } from "sdk/idl";
import findTreasuryEscrowPda from "sdk/pdas/findTreasuryEscrowPda";
import createEscrowIxForTest from "tests/utils/createEsrowIxForTest";
import expectTransactionToFailWithErrorCode from "tests/utils/expectTransactionToFailWithErrorCode";
import getCampaignEscrowInputForTest from "tests/utils/getCampaignEscrowInputForTest";
import getConnectionAndSdkForTest from "tests/utils/getConnectionAndSdkForTest";

type CreateEscrowIxInputAccounts = {
  authority: PublicKey;
  creator: PublicKey;
  payoutWalletOwner: PublicKey;
  treasuryMint: PublicKey;
};

type CreateEscrowIxOutputAccounts = CreateEscrowIxInputAccounts & {
  payer: PublicKey;
  payoutWallet: PublicKey;
  treasuryEscrow: PublicKey;
};

async function getCorrectAccountsForTest(
  args: CreateEscrowIxInputAccounts & {
    campaignUuid: string;
    program: CampaignTreasuryManagerProgram;
  }
): Promise<{ accounts: CreateEscrowIxOutputAccounts; treasuryBump: number }> {
  const {
    authority,
    campaignUuid,
    creator,
    payoutWalletOwner,
    program,
    treasuryMint,
  } = args;

  const [treasuryEscrow, treasuryBump] = findTreasuryEscrowPda(
    campaignUuid,
    program.programId
  );

  const [payoutWallet] = isMintNative(treasuryMint)
    ? [payoutWalletOwner]
    : findAtaPda(payoutWalletOwner, treasuryMint);

  return {
    accounts: {
      authority,
      creator,
      payer: authority,
      payoutWallet,
      payoutWalletOwner,
      treasuryEscrow,
      treasuryMint: args.treasuryMint,
    },
    treasuryBump,
  };
}

describe("TreasuryEscrow account(s) validation.", () => {
  test("CreateEscrow with an invalid treasuryEscrow PDA should fail.", async () => {
    const { connection, authority, sdk } = await getConnectionAndSdkForTest();

    const {
      campaignUuid,
      createCampaignEscrowInput,
      setupOptions: { creator },
    } = await getCampaignEscrowInputForTest(connection, authority);
    const treasuryMint = NATIVE_MINT;

    const { accounts } = await getCorrectAccountsForTest({
      authority: authority.publicKey,
      campaignUuid,
      creator: creator.publicKey,
      payoutWalletOwner: authority.publicKey,
      program: sdk.program,
      treasuryMint,
    });

    const ix = await createEscrowIxForTest(
      {
        ...accounts,
        treasuryEscrow: Keypair.generate().publicKey,
      },
      {
        campaignUuid,
        createCampaignEscrowInput,
        program: sdk.program,
        treasuryBump: 255,
      }
    );

    await expectTransactionToFailWithErrorCode({
      connection,
      errorName: "ConstraintSeeds",
      signers: [authority],
      transaction: ixToTx(ix),
    });
  });

  test("The payoutWalletOwner account cannot be an ATA if a native treasury mint is used.", async () => {
    const {
      connection,
      authority,
      otherKeypair: wallet,
      sdk,
    } = await getConnectionAndSdkForTest();

    const {
      campaignUuid,
      createCampaignEscrowInput,
      setupOptions: { creator },
    } = await getCampaignEscrowInputForTest(connection, authority);
    const treasuryMint = NATIVE_MINT;

    const splMint = await createSplToken(connection, authority);
    const [payoutWalletOwner] = findAtaPda(wallet.publicKey, splMint);

    const { accounts, treasuryBump } = await getCorrectAccountsForTest({
      authority: authority.publicKey,
      campaignUuid,
      creator: creator.publicKey,
      payoutWalletOwner: authority.publicKey,
      program: sdk.program,
      treasuryMint,
    });

    const ix = await createEscrowIxForTest(
      {
        ...accounts,
        payoutWalletOwner,
      },
      {
        campaignUuid,
        createCampaignEscrowInput,
        program: sdk.program,
        treasuryBump,
      }
    );

    await expectTransactionToFailWithErrorCode({
      connection,
      errorName: "InvalidTreasuryEscrow",
      signers: [authority],
      transaction: ixToTx(ix),
    });
  });

  test("The payoutWallet account must be an ATA of the treasury mint for non-native treasuries.", async () => {
    const {
      connection,
      authority,
      otherKeypair: wallet,
      sdk,
    } = await getConnectionAndSdkForTest();

    const {
      campaignUuid,
      createCampaignEscrowInput,
      setupOptions: { creator },
    } = await getCampaignEscrowInputForTest(connection, authority);
    const treasuryMint = await createSplToken(connection, authority);

    const [invalidPayoutWalletAta] = findAtaPda(
      wallet.publicKey,
      Keypair.generate().publicKey
    );

    const { accounts, treasuryBump } = await getCorrectAccountsForTest({
      authority: authority.publicKey,
      campaignUuid,
      creator: creator.publicKey,
      payoutWalletOwner: authority.publicKey,
      program: sdk.program,
      treasuryMint,
    });

    const ix = await createEscrowIxForTest(
      {
        ...accounts,
        payoutWallet: invalidPayoutWalletAta,
        payoutWalletOwner: wallet.publicKey,
      },
      {
        campaignUuid,
        createCampaignEscrowInput,
        program: sdk.program,
        treasuryBump,
      }
    );

    await expectTransactionToFailWithErrorCode({
      connection,
      errorName: "MissingAccount",
      signers: [authority],
      transaction: ixToTx(ix),
    });
  });

  test("The payoutWallet account must be an ATA for non native treasuries.", async () => {
    const {
      connection,
      authority,
      otherKeypair: wallet,
      sdk,
    } = await getConnectionAndSdkForTest();

    const {
      campaignUuid,
      createCampaignEscrowInput,
      setupOptions: { creator },
    } = await getCampaignEscrowInputForTest(connection, authority);
    const treasuryMint = await createSplToken(connection, authority);

    const { accounts, treasuryBump } = await getCorrectAccountsForTest({
      authority: authority.publicKey,
      campaignUuid,
      creator: creator.publicKey,
      payoutWalletOwner: authority.publicKey,
      program: sdk.program,
      treasuryMint,
    });

    const ix = await createEscrowIxForTest(
      {
        ...accounts,
        payoutWallet: wallet.publicKey,
        payoutWalletOwner: wallet.publicKey,
      },
      {
        campaignUuid,
        createCampaignEscrowInput,
        program: sdk.program,
        treasuryBump,
      }
    );

    await expectTransactionToFailWithErrorCode({
      connection,
      errorName: "MissingAccount",
      signers: [authority],
      transaction: ixToTx(ix),
    });
  });
});
