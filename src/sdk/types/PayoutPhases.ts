import NonVotingPayoutPhase from "sdk/types/NonVotingPayoutPhase";
import VotingPayoutPhase from "sdk/types/VotingPayoutPhase";

// Note: Keep in sync with program.
type PayoutPhases = {
  nonVotingPayoutPhases: Array<NonVotingPayoutPhase>;
  votingPayoutPhases: Array<VotingPayoutPhase>;
};

export default PayoutPhases;
