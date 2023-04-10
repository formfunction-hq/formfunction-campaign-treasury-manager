import BN from "bn.js";
import getSecondsAheadUnixTime from "tests/utils/getSecondsAheadUnixTime";

export default function getDefaultCampaignEndTimeForTest(): BN {
  return getSecondsAheadUnixTime(5);
}
