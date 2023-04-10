import BN from "bn.js";
import dayjs from "dayjs";

export default function getSecondsAheadUnixTime(secondsAhead: number): BN {
  return new BN(dayjs().add(secondsAhead, "seconds").unix());
}
