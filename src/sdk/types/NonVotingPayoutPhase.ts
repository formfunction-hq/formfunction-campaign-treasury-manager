import SharedPayoutPhaseFields from "sdk/types/SharedPayoutPhaseFields";

// Note: Keep in sync with program.
type NonVotingPayoutPhase = {
  isPaidOut: boolean;
  isVetoedByAuthority: boolean;
  sharedFields: SharedPayoutPhaseFields;
};

export default NonVotingPayoutPhase;
