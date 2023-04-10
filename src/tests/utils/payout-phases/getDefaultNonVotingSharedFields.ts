import {
  GenericNumber,
  percentToBasisPoints,
} from "@formfunction-hq/formfunction-program-shared";
import SharedPayoutPhaseFields from "sdk/types/SharedPayoutPhaseFields";
import getDefaultCampaignEndTimeForTest from "tests/utils/getDefaultCampaignEndTimeForTest";
import getSecondsAfterCampaignEndTime from "tests/utils/payout-phases/getSecondsAfterCampaignEndTime";

export default function getDefaultNonVotingSharedFields(
  campaignEndTime: GenericNumber = getDefaultCampaignEndTimeForTest()
): SharedPayoutPhaseFields {
  return {
    description: "Initial payout for campaign completion.",
    index: 0,
    payoutBasisPoints: percentToBasisPoints(100).toNumber(),
    payoutTime: getSecondsAfterCampaignEndTime(campaignEndTime, 6),
    refundDeadline: getSecondsAfterCampaignEndTime(campaignEndTime, 8),
  };
}
