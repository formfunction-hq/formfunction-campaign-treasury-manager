import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";
import { CampaignTreasuryManagerProgram } from "sdk/idl";
import findCampaignEscrowPda from "sdk/pdas/findCampaignEscrowPda";
import findTreasuryEscrowPda from "sdk/pdas/findTreasuryEscrowPda";

type Accounts = {
  payer: PublicKey;
};

type Args = {
  campaignUuid: string;
  program: CampaignTreasuryManagerProgram;
};

export default async function payOutFundsIx(
  { payer }: Accounts,
  { campaignUuid, program }: Args
): Promise<TransactionInstruction> {
  const [campaignEscrow] = findCampaignEscrowPda(
    campaignUuid,
    program.programId
  );
  const [treasuryEscrow] = findTreasuryEscrowPda(
    campaignUuid,
    program.programId
  );

  const campaignEscrowAccount = await program.account.campaignEscrow.fetch(
    campaignEscrow
  );

  return program.methods
    .payOutFunds()
    .accounts({
      campaignEscrow,
      payer,
      payoutWallet: campaignEscrowAccount.payoutWallet,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      treasuryEscrow,
    })
    .instruction();
}
