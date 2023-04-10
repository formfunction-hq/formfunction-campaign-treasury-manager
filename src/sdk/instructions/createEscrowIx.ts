import {
  convertUuidToPdaSeed,
  findAtaPda,
  isMintNative,
} from "@formfunction-hq/formfunction-program-shared";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from "@solana/web3.js";
import { CampaignTreasuryManagerProgram } from "sdk/idl";
import findCampaignEscrowPda from "sdk/pdas/findCampaignEscrowPda";
import findTreasuryEscrowPda from "sdk/pdas/findTreasuryEscrowPda";
import CreateCampaignEscrowInput from "sdk/types/CreateCampaignEscrowInput";

type Accounts = {
  authority: PublicKey;
  creator: PublicKey;
  payer: PublicKey;
  payoutWalletOwner: PublicKey;
  treasuryMint: PublicKey;
};

type Args = {
  campaignUuid: string;
  createCampaignEscrowInput: CreateCampaignEscrowInput;
  program: CampaignTreasuryManagerProgram;
};

export default async function createEscrowIx(
  { authority, creator, payer, treasuryMint, payoutWalletOwner }: Accounts,
  { createCampaignEscrowInput, campaignUuid, program }: Args
): Promise<TransactionInstruction> {
  const [campaignEscrow] = findCampaignEscrowPda(
    campaignUuid,
    program.programId
  );
  const [treasuryEscrow, treasuryBump] = findTreasuryEscrowPda(
    campaignUuid,
    program.programId
  );

  const [payoutWallet] = isMintNative(treasuryMint)
    ? [payoutWalletOwner]
    : findAtaPda(payoutWalletOwner, treasuryMint);

  return program.methods
    .createEscrow(
      convertUuidToPdaSeed(campaignUuid),
      treasuryBump,
      createCampaignEscrowInput
    )
    .accounts({
      ataProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      authority,
      campaignEscrow,
      creator,
      payer,
      payoutWallet,
      payoutWalletOwner,
      rent: SYSVAR_RENT_PUBKEY,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      treasuryEscrow,
      treasuryMint,
    })
    .instruction();
}
