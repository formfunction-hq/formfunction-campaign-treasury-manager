import { Program } from "@project-serum/anchor";
import { CampaignTreasuryManager } from "sdk/idl/CampaignTreasuryManager";
import convertIdlForAnchorProgram from "sdk/idl/convertIdlForAnchorProgram";

const CAMPAIGN_TREASURY_MANAGER_IDL = convertIdlForAnchorProgram();

export { CAMPAIGN_TREASURY_MANAGER_IDL };

export type CampaignTreasuryManagerProgram = Program<CampaignTreasuryManager>;
