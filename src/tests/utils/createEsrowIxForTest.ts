import { convertUuidToPdaSeed } from "@formfunction-hq/formfunction-program-shared";
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
import CreateCampaignEscrowInput from "sdk/types/CreateCampaignEscrowInput";

type Accounts = {
  authority: PublicKey;
  creator: PublicKey;
  payer: PublicKey;
  payoutWallet: PublicKey;
  payoutWalletOwner: PublicKey;
  treasuryEscrow: PublicKey;
  treasuryMint: PublicKey;
};

type Args = {
  campaignUuid: string;
  createCampaignEscrowInput: CreateCampaignEscrowInput;
  program: CampaignTreasuryManagerProgram;
  treasuryBump: number;
};

/**
 * This overrides the internal SDK function because we want to test passing in
 * spurious treasuryEscrow and payoutWallet accounts, but in reality these
 * should always be derived PDAs (i.e. correct) when calling through the SDK.
 */
export default async function createEscrowIxForTest(
  {
    authority,
    creator,
    payer,
    payoutWallet,
    payoutWalletOwner,
    treasuryEscrow,
    treasuryMint,
  }: Accounts,
  { campaignUuid, createCampaignEscrowInput, program, treasuryBump }: Args
): Promise<TransactionInstruction> {
  const [campaignEscrow] = findCampaignEscrowPda(
    campaignUuid,
    program.programId
  );

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
