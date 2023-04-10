import PayoutPhases from "sdk/types/PayoutPhases";
import PayoutPhaseUnion from "sdk/types/PayoutPhaseUnion";

type PayoutPhasesOrderedArray = Array<PayoutPhaseUnion>;

export default function getPayoutPhasesOrderedArray(
  payoutPhases: PayoutPhases
): PayoutPhasesOrderedArray {
  return [
    ...payoutPhases.nonVotingPayoutPhases,
    ...payoutPhases.votingPayoutPhases,
  ].sort((a, b) => a.sharedFields.index - b.sharedFields.index);
}
