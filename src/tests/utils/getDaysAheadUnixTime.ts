import BN from "bn.js";
import dayjs from "dayjs";

export default function getDaysAheadUnixTime(daysAhead: number): BN {
  return new BN(dayjs().add(daysAhead, "days").unix());
}
