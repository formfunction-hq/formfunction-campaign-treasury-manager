import {
  ANTI_BOT_DEV_AUTHORITY,
  ANTI_BOT_MAINNET_AUTHORITY,
} from "@formfunction-hq/formfunction-program-shared";
import { PublicKey } from "@solana/web3.js";

export type CampaignTreasuryManagerProgramIds = {
  botSignerAuthority: PublicKey;
  programId: PublicKey;
};

export const LOCALNET_PROGRAM_IDS: CampaignTreasuryManagerProgramIds = {
  botSignerAuthority: ANTI_BOT_DEV_AUTHORITY,
  programId: new PublicKey("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"),
};

export const TESTNET_PROGRAM_IDS: CampaignTreasuryManagerProgramIds = {
  botSignerAuthority: ANTI_BOT_DEV_AUTHORITY,
  programId: new PublicKey("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"),
};

export const DEVNET_PROGRAM_IDS: CampaignTreasuryManagerProgramIds = {
  botSignerAuthority: ANTI_BOT_DEV_AUTHORITY,
  programId: new PublicKey("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"),
};

export const MAINNET_PROGRAM_IDS: CampaignTreasuryManagerProgramIds = {
  botSignerAuthority: ANTI_BOT_MAINNET_AUTHORITY,
  programId: new PublicKey("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"),
};
