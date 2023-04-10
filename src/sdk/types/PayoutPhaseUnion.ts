import NonVotingPayoutPhase from "sdk/types/NonVotingPayoutPhase";
import VotingPayoutPhase from "sdk/types/VotingPayoutPhase";

type PayoutPhaseUnion = NonVotingPayoutPhase | VotingPayoutPhase;

export default PayoutPhaseUnion;
