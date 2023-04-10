import BN from "bn.js";

// Note: Keep in sync with program.
type SharedPayoutPhaseFields = {
  description: string;
  index: number;
  payoutBasisPoints: number;
  payoutTime: BN;
  refundDeadline: BN;
};

export default SharedPayoutPhaseFields;
