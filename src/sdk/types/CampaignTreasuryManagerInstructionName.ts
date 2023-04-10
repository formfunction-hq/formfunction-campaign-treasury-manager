import { CAMPAIGN_TREASURY_MANAGER_IDL } from "sdk/idl";

const INSTRUCTION_NAMES = CAMPAIGN_TREASURY_MANAGER_IDL.instructions.map(
  (ix) => ix.name
);

type CampaignTreasuryManagerInstructionName = typeof INSTRUCTION_NAMES[0];

export default CampaignTreasuryManagerInstructionName;
