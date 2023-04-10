import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import { CampaignTreasuryManagerProgram } from "sdk/idl";
import findCampaignEscrowPda from "sdk/pdas/findCampaignEscrowPda";
import findDepositEscrowPda from "sdk/pdas/findDepositEscrowPda";

type Accounts = {
  authority: PublicKey;
  depositEscrowMint: PublicKey;
  receiver: PublicKey;
};

type Args = {
  campaignUuid: string;
  program: CampaignTreasuryManagerProgram;
};

export default async function closeDepositEscrowIx(
  { authority, depositEscrowMint, receiver }: Accounts,
  { campaignUuid, program }: Args
): Promise<TransactionInstruction> {
  const [campaignEscrow] = findCampaignEscrowPda(
    campaignUuid,
    program.programId
  );
  const [depositEscrow] = findDepositEscrowPda(
    campaignUuid,
    depositEscrowMint,
    program.programId
  );

  return program.methods
    .closeDepositEscrow()
    .accounts({
      authority,
      campaignEscrow,
      depositEscrow,
      depositEscrowMint,
      receiver,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .instruction();
}
