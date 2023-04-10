import NonVotingPayoutPhaseInput from "sdk/types/NonVotingPayoutPhaseInput";

type PayoutPhasesTestInput = {
  nonVotingPayoutPhases: Array<NonVotingPayoutPhaseInput>;
  votingPayoutPhases: Array<never>; // TODO[@]: Will get filled in later.
};

export default PayoutPhasesTestInput;
