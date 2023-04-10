import { Maybe } from "@formfunction-hq/formfunction-program-shared";
import PayoutPhases from "sdk/types/PayoutPhases";
import PayoutPhaseUnion from "sdk/types/PayoutPhaseUnion";
import getPayoutPhasesOrderedArray from "sdk/utils/getPayoutPhasesOrderedArray";

export default function getCurrentActivePayoutPhase(
  payoutPhases: PayoutPhases
): Maybe<PayoutPhaseUnion> {
  for (const payoutPhase of getPayoutPhasesOrderedArray(payoutPhases)) {
    if (!payoutPhase.isPaidOut) {
      return payoutPhase;
    }
  }

  return null;
}
