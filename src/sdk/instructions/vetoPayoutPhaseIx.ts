import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import { CampaignTreasuryManagerProgram } from "sdk/idl";
import findCampaignEscrowPda from "sdk/pdas/findCampaignEscrowPda";

type Accounts = {
  authority: PublicKey;
  payer: PublicKey;
};

type Args = {
  campaignUuid: string;
  payoutPhaseIndex: number;
  program: CampaignTreasuryManagerProgram;
};

export default async function vetoPayoutPhaseIx(
  { authority, payer }: Accounts,
  { campaignUuid, payoutPhaseIndex, program }: Args
): Promise<TransactionInstruction> {
  const [campaignEscrow] = findCampaignEscrowPda(
    campaignUuid,
    program.programId
  );

  return program.methods
    .vetoPayoutPhase(payoutPhaseIndex)
    .accounts({
      authority,
      campaignEscrow,
      payer,
    })
    .instruction();
}
