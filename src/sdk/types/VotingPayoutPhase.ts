import BN from "bn.js";
import SharedPayoutPhaseFields from "sdk/types/SharedPayoutPhaseFields";

// Note: Keep in sync with program.
type VotingPayoutPhase = {
  isPaidOut: boolean;
  isVetoedByAuthority: boolean;
  sharedFields: SharedPayoutPhaseFields;
  vetoVotes: BN;
  voteBasisPointsVetoThreshold: number;
  votingStartTime: BN;
};

export default VotingPayoutPhase;
