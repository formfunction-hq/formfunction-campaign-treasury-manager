import { BN } from "bn.js";
import getPayoutPhasesOrderedArray from "sdk/utils/getPayoutPhasesOrderedArray";

describe("SDK unit tests.", () => {
  test("Test getPayoutPhasesOrderedArray.", () => {
    const payoutPhases = {
      nonVotingPayoutPhases: [
        {
          isPaidOut: false,
          isVetoedByAuthority: false,
          sharedFields: {
            description: "Initial payout for campaign completion.",
            index: 0,
            payoutBasisPoints: 50,
            payoutTime: new BN(5),
            refundDeadline: new BN(10),
          },
        },
      ],
      votingPayoutPhases: [
        {
          isPaidOut: false,
          isVetoedByAuthority: false,

          sharedFields: {
            description: "Initial payout for campaign completion.",
            index: 2,
            payoutBasisPoints: 25,
            payoutTime: new BN(1),
            refundDeadline: new BN(10),
          },
          vetoVotes: new BN(0),
          voteBasisPointsVetoThreshold: 50,
          votingStartTime: new BN(25),
        },
        {
          isPaidOut: false,
          isVetoedByAuthority: false,
          sharedFields: {
            description: "Initial payout for campaign completion.",
            index: 1,
            payoutBasisPoints: 25,
            payoutTime: new BN(1),
            refundDeadline: new BN(10),
          },
          vetoVotes: new BN(0),
          voteBasisPointsVetoThreshold: 50,
          votingStartTime: new BN(50),
        },
      ],
    };
    const result = getPayoutPhasesOrderedArray(payoutPhases);
    expect(result.length).toBe(3);
    result.forEach((val, i) => expect(val.sharedFields.index).toBe(i));
  });
});
