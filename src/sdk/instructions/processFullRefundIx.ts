import { PublicKey, TransactionInstruction } from "@solana/web3.js";
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

export default async function processFullRefundIx(
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

  return program.methods
    .processFullRefund()
    .accounts({
      campaignEscrow,
      payer,
      treasuryEscrow,
    })
    .instruction();
}
