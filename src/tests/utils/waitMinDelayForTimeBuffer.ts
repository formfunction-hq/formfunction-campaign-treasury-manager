import { sleep } from "@formfunction-hq/formfunction-program-shared";

const EXTRA_BUFFER_TIME_IN_SECONDS = 4;

/**
 * Testing logic which involves the buffer times is a bit difficult, because
 * the tests code is not actually executed at the same time.
 *
 * If the times and time delays are too far apart (to guarantee the time
 * buffers will be respected) the tests take a long time to run. If are they
 * are too close, the tests will be flakey and sometimes fail.
 *
 * This function takes a min time delay, which can be calculated with the
 * relevant context in a test, and then adds some buffer time and sleeps for the
 * resulting amount of time.
 */
export default async function waitMinDelayForTimeBuffer(
  minDelaySeconds = 0
): Promise<void> {
  await sleep(Math.abs(minDelaySeconds + EXTRA_BUFFER_TIME_IN_SECONDS));
}
