import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import { CampaignTreasuryManagerProgram } from "sdk/idl";
import findCampaignEscrowPda from "sdk/pdas/findCampaignEscrowPda";
import findTreasuryEscrowPda from "sdk/pdas/findTreasuryEscrowPda";

type Accounts = {
  authority: PublicKey;
  creator: PublicKey;
  payer: PublicKey;
  receiver: PublicKey;
};

type Args = {
  campaignUuid: string;
  program: CampaignTreasuryManagerProgram;
};

export default async function closeEscrowIx(
  { authority, creator, receiver, payer }: Accounts,
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
    .closeEscrow()
    .accounts({
      authority,
      campaignEscrow,
      creator,
      payer,
      receiver,
      tokenProgram: TOKEN_PROGRAM_ID,
      treasuryEscrow,
    })
    .instruction();
}
