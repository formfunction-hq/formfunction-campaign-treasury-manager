import BN from "bn.js";
import NonVotingPayoutPhaseInput from "sdk/types/NonVotingPayoutPhaseInput";

// Note: Keep in sync with program.
type CreateCampaignEscrowInput = {
  campaignEndTime: BN;
  nonVotingPayoutPhases: Array<NonVotingPayoutPhaseInput>;
  votingPayoutPhases: Array<never>;
};

export default CreateCampaignEscrowInput;
