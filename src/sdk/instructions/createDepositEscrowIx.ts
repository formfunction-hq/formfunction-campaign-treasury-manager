import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";
import { CampaignTreasuryManagerProgram } from "sdk/idl";
import findCampaignEscrowPda from "sdk/pdas/findCampaignEscrowPda";
import findDepositEscrowPda from "sdk/pdas/findDepositEscrowPda";

type Accounts = {
  depositEscrowMint: PublicKey;
};

type Args = {
  campaignUuid: string;
  program: CampaignTreasuryManagerProgram;
};

export default async function createDepositEscrowIx(
  { depositEscrowMint }: Accounts,
  { campaignUuid, program }: Args
): Promise<TransactionInstruction> {
  const [campaignEscrow] = findCampaignEscrowPda(
    campaignUuid,
    program.programId
  );
  const [depositEscrow, depositEscrowBump] = findDepositEscrowPda(
    campaignUuid,
    depositEscrowMint,
    program.programId
  );

  const { authority } = await program.account.campaignEscrow.fetch(
    campaignEscrow
  );

  return program.methods
    .createDepositEscrow(depositEscrowBump)
    .accounts({
      authority,
      campaignEscrow,
      depositEscrow,
      depositEscrowMint,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .instruction();
}
