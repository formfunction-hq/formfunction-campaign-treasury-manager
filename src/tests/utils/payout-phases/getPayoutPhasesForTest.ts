import { percentToBasisPoints } from "@formfunction-hq/formfunction-program-shared";
import BN from "bn.js";
import PayoutPhasesTestInput from "tests/types/PayoutPhasesTestInput";
import getSecondsAheadUnixTime from "tests/utils/getSecondsAheadUnixTime";
import getDefaultNonVotingSharedFields from "tests/utils/payout-phases/getDefaultNonVotingSharedFields";
import getSecondsAfterCampaignEndTime from "tests/utils/payout-phases/getSecondsAfterCampaignEndTime";

type PayoutPhasesTestCases = Array<
  PayoutPhasesTestInput & {
    label: string;
  }
>;

function getValidTestCases(campaignEndTime: BN): PayoutPhasesTestCases {
  return [
    {
      label: "Default valid payout phases I.",
      nonVotingPayoutPhases: [
        {
          sharedFields: getDefaultNonVotingSharedFields(campaignEndTime),
        },
      ],
      votingPayoutPhases: [],
    },
    {
      label: "Default valid payout phases II.",
      nonVotingPayoutPhases: [
        {
          sharedFields: {
            ...getDefaultNonVotingSharedFields(campaignEndTime),
            payoutTime: getSecondsAfterCampaignEndTime(campaignEndTime, 4),
            refundDeadline: getSecondsAfterCampaignEndTime(campaignEndTime, 7),
          },
        },
      ],
      votingPayoutPhases: [],
    },
  ];
}

function getInvalidTestCases(campaignEndTime: BN): PayoutPhasesTestCases {
  return [
    {
      label: "Invalid initial payout phase index I.",
      nonVotingPayoutPhases: [
        {
          sharedFields: {
            ...getDefaultNonVotingSharedFields(campaignEndTime),
            index: 1,
          },
        },
      ],
      votingPayoutPhases: [],
    },
    {
      label: "Invalid initial payout phase index II.",
      nonVotingPayoutPhases: [
        {
          sharedFields: {
            ...getDefaultNonVotingSharedFields(campaignEndTime),
            index: 10,
          },
        },
      ],
      votingPayoutPhases: [],
    },
    {
      label: "Invalid initial basis points I.",
      nonVotingPayoutPhases: [
        {
          sharedFields: {
            ...getDefaultNonVotingSharedFields(campaignEndTime),
            payoutBasisPoints: percentToBasisPoints(20).toNumber(),
          },
        },
      ],
      votingPayoutPhases: [],
    },
    {
      label: "Invalid initial basis points II.",
      nonVotingPayoutPhases: [
        {
          sharedFields: {
            ...getDefaultNonVotingSharedFields(campaignEndTime),
            payoutBasisPoints: percentToBasisPoints(101).toNumber(),
          },
        },
      ],
      votingPayoutPhases: [],
    },
    {
      label: "Invalid initial payout payout time.",
      nonVotingPayoutPhases: [
        {
          sharedFields: {
            ...getDefaultNonVotingSharedFields(campaignEndTime),
            payoutTime: getSecondsAfterCampaignEndTime(campaignEndTime, -1),
            refundDeadline: getSecondsAfterCampaignEndTime(campaignEndTime, 30),
          },
        },
      ],
      votingPayoutPhases: [],
    },
    {
      label:
        "Invalid initial payout payout time (invalid minimum buffer time).",
      nonVotingPayoutPhases: [
        {
          sharedFields: {
            ...getDefaultNonVotingSharedFields(campaignEndTime),
            payoutTime: getSecondsAfterCampaignEndTime(campaignEndTime, 1),
            refundDeadline: getSecondsAfterCampaignEndTime(campaignEndTime, 30),
          },
        },
      ],
      votingPayoutPhases: [],
    },
    {
      label:
        "Invalid initial payout payout time (invalid maximum buffer time).",
      nonVotingPayoutPhases: [
        {
          sharedFields: {
            ...getDefaultNonVotingSharedFields(campaignEndTime),
            payoutTime: getSecondsAfterCampaignEndTime(campaignEndTime, 25),
            refundDeadline: getSecondsAfterCampaignEndTime(campaignEndTime, 30),
          },
        },
      ],
      votingPayoutPhases: [],
    },
    {
      label:
        "Invalid initial payout refund deadline (refund deadline is before payout time).",
      nonVotingPayoutPhases: [
        {
          sharedFields: {
            ...getDefaultNonVotingSharedFields(campaignEndTime),
            payoutTime: getSecondsAfterCampaignEndTime(campaignEndTime, 6),
            refundDeadline: getSecondsAfterCampaignEndTime(campaignEndTime, 5),
          },
        },
      ],
      votingPayoutPhases: [],
    },
    {
      label:
        "Invalid initial payout refund deadline (invalid minimum buffer time).",
      nonVotingPayoutPhases: [
        {
          sharedFields: {
            ...getDefaultNonVotingSharedFields(campaignEndTime),
            payoutTime: getSecondsAfterCampaignEndTime(campaignEndTime, 6),
            refundDeadline: getSecondsAfterCampaignEndTime(campaignEndTime, 7),
          },
        },
      ],
      votingPayoutPhases: [],
    },
    {
      label:
        "Invalid initial payout refund deadline (invalid maximum buffer time).",
      nonVotingPayoutPhases: [
        {
          sharedFields: {
            ...getDefaultNonVotingSharedFields(campaignEndTime),
            payoutTime: getSecondsAfterCampaignEndTime(campaignEndTime, 6),
            refundDeadline: getSecondsAfterCampaignEndTime(campaignEndTime, 25),
          },
        },
      ],
      votingPayoutPhases: [],
    },
  ];
}

/**
 * These are all functions instead of static constants because the time values
 * need to be accurate in relation to the current time when these are used
 * when running the tests.
 */
export default function getPayoutPhasesForTest(): {
  campaignEndTime: BN;
  invalid: PayoutPhasesTestCases;
  valid: PayoutPhasesTestCases;
} {
  const campaignEndTime = getSecondsAheadUnixTime(4);
  return {
    campaignEndTime,
    invalid: getInvalidTestCases(campaignEndTime),
    valid: getValidTestCases(campaignEndTime),
  };
}
