import { CampaignTreasuryManagerProgram } from "sdk/idl";
import DepositEscrowInfo from "sdk/types/DepositEscrowInfo";
import PayoutPhases from "sdk/types/PayoutPhases";

/**
 * Everything referenced in here needs to be kept in sync with the program.
 * See: https://www.notion.so/formfunction/Anchor-IDL-Type-Definition-Limitations-4ddfa382254b4fca99f1bc165938465e
 */

type CampaignEscrowAnchorIdlType = Awaited<
  ReturnType<
    CampaignTreasuryManagerProgram["account"]["campaignEscrow"]["fetch"]
  >
>;

type CampaignEscrowAccountOmittedFields = Omit<
  CampaignEscrowAnchorIdlType,
  "payoutPhases"
>;

type CampaignEscrowAccount = CampaignEscrowAccountOmittedFields & {
  depositEscrowInfos: Array<DepositEscrowInfo>;
  payoutPhases: PayoutPhases;
};

export default CampaignEscrowAccount;
