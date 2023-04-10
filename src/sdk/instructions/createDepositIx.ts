import {
  arePublicKeysEqual,
  findAtaPda,
  isMintNative,
} from "@formfunction-hq/formfunction-program-shared";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
  PublicKey,
  SystemProgram,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  TransactionInstruction,
} from "@solana/web3.js";
import BN from "bn.js";
import { CampaignTreasuryManagerProgram } from "sdk/idl";
import findCampaignEscrowPda from "sdk/pdas/findCampaignEscrowPda";
import findDepositEscrowPda from "sdk/pdas/findDepositEscrowPda";
import findDepositRecordPda from "sdk/pdas/findDepositRecordPda";

type Accounts = {
  depositor: PublicKey;
  mint: PublicKey;
  saleCurrencyMint: PublicKey;
};

type Args = {
  campaignUuid: string;
  depositAmount: BN;
  program: CampaignTreasuryManagerProgram;
};

export default async function createDepositIx(
  { depositor, mint, saleCurrencyMint }: Accounts,
  { campaignUuid, depositAmount, program }: Args
): Promise<TransactionInstruction> {
  const [campaignEscrow] = findCampaignEscrowPda(
    campaignUuid,
    program.programId
  );
  const [depositRecord] = findDepositRecordPda(
    depositor,
    mint,
    program.programId
  );
  const [depositEscrow] = findDepositEscrowPda(
    campaignUuid,
    saleCurrencyMint,
    program.programId
  );

  const campaignEscrowAccount = await program.account.campaignEscrow.fetch(
    campaignEscrow
  );

  const depositMatchesCampaignTreasury = arePublicKeysEqual(
    campaignEscrowAccount.treasury.treasuryMint,
    saleCurrencyMint
  );

  const depositEscrowAccount = depositMatchesCampaignTreasury
    ? campaignEscrowAccount.treasury.treasuryEscrow
    : depositEscrow;

  const [depositorPaymentAccount] = isMintNative(saleCurrencyMint)
    ? [depositor]
    : findAtaPda(depositor, saleCurrencyMint);

  return program.methods
    .createDeposit(depositAmount)
    .accounts({
      campaignEscrow,
      depositEscrow: depositEscrowAccount,
      depositEscrowMint: saleCurrencyMint,
      depositRecord,
      depositor,
      depositorPaymentAccount,
      instructionSysvarAccount: SYSVAR_INSTRUCTIONS_PUBKEY,
      mint,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .instruction();
}
