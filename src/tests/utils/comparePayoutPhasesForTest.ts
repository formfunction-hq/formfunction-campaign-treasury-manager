import NonVotingPayoutPhaseInput from "sdk/types/NonVotingPayoutPhaseInput";
import PayoutPhases from "sdk/types/PayoutPhases";

export default function comparePayoutPhasesForTest(
  payoutPhases: PayoutPhases,
  nonVotingPayoutPhaseInput: Array<NonVotingPayoutPhaseInput>,
  votingPayoutPhaseInput: Array<NonVotingPayoutPhaseInput>
): void {
  expect(
    payoutPhases.votingPayoutPhases.length +
      payoutPhases.nonVotingPayoutPhases.length
  ).toBe(nonVotingPayoutPhaseInput.length + votingPayoutPhaseInput.length);

  payoutPhases.nonVotingPayoutPhases.forEach((nonVotingPayoutPhase, index) => {
    const payoutPhaseInput = nonVotingPayoutPhaseInput[index];

    expect(nonVotingPayoutPhase.sharedFields.index).toBe(
      payoutPhaseInput.sharedFields.index
    );
    expect(nonVotingPayoutPhase.sharedFields.description).toBe(
      payoutPhaseInput.sharedFields.description
    );
    expect(nonVotingPayoutPhase.isPaidOut).toBe(false);
    expect(nonVotingPayoutPhase.isVetoedByAuthority).toBe(false);
    expect(nonVotingPayoutPhase.sharedFields.payoutBasisPoints).toBe(
      payoutPhaseInput.sharedFields.payoutBasisPoints
    );
    expect(nonVotingPayoutPhase.sharedFields.payoutTime.toNumber()).toBe(
      payoutPhaseInput.sharedFields.payoutTime.toNumber()
    );
    expect(nonVotingPayoutPhase.sharedFields.refundDeadline.toNumber()).toBe(
      payoutPhaseInput.sharedFields.refundDeadline.toNumber()
    );
  });

  payoutPhases.votingPayoutPhases.forEach((_votingPayoutPhase, _index) => {
    // TODO[@]: Fill in for voting payout phases.
  });
}
