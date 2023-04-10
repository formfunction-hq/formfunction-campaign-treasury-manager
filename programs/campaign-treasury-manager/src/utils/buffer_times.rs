pub const SECONDS_PER_DAY: i64 = 60 * 60 * 24;
pub const DAYS_PER_MONTH: i64 = 30; // ~ Generally about 30 days per month.

// Not sure why a warning message appears without this.
#[allow(dead_code)]
const fn days(num_days: i64) -> i64 {
    SECONDS_PER_DAY * num_days
}

// Not sure why a warning message appears without this.
#[allow(dead_code)]
const fn months(num_months: i64) -> i64 {
    SECONDS_PER_DAY * DAYS_PER_MONTH * num_months
}

pub struct MinBufferTimes {}

pub trait MinBufferTimesTrait {
    // Minimum time between now and the campaign end time.
    const NOW_TO_CAMPAIGN_END_TIME_IN_SECONDS: i64;
    // Minimum time between the campaign end time and the initial payout.
    const CAMPAIGN_END_TIME_TO_INITIAL_PAYOUT_IN_SECONDS: i64;
    // Minimum time between payout phase payout times.
    const PAYOUT_TIME_TO_NEXT_PAYOUT_TIME_IN_SECONDS: i64;
    // Minimum time to claim refunds for a payout phase.
    const PAYOUT_TIME_TO_REFUND_DEADLINE_IN_SECONDS: i64;
    // Minimum time between last payout and when the escrow can be closed.
    const LAST_REFUND_DEADLINE_TO_CLOSE_ESCROW_IN_SECONDS: i64;
}

// Enabled for testing.
#[cfg(feature = "use-test-env")]
impl MinBufferTimesTrait for MinBufferTimes {
    const NOW_TO_CAMPAIGN_END_TIME_IN_SECONDS: i64 = 2;
    const CAMPAIGN_END_TIME_TO_INITIAL_PAYOUT_IN_SECONDS: i64 = 2;
    const PAYOUT_TIME_TO_NEXT_PAYOUT_TIME_IN_SECONDS: i64 = 2;
    const PAYOUT_TIME_TO_REFUND_DEADLINE_IN_SECONDS: i64 = 2;
    const LAST_REFUND_DEADLINE_TO_CLOSE_ESCROW_IN_SECONDS: i64 = 2;
}

// Enabled for non-test builds.
#[cfg(not(feature = "use-test-env"))]
impl MinBufferTimesTrait for MinBufferTimes {
    const NOW_TO_CAMPAIGN_END_TIME_IN_SECONDS: i64 = days(14);
    const CAMPAIGN_END_TIME_TO_INITIAL_PAYOUT_IN_SECONDS: i64 = days(3);
    const PAYOUT_TIME_TO_NEXT_PAYOUT_TIME_IN_SECONDS: i64 = days(30);
    const PAYOUT_TIME_TO_REFUND_DEADLINE_IN_SECONDS: i64 = days(30);
    const LAST_REFUND_DEADLINE_TO_CLOSE_ESCROW_IN_SECONDS: i64 = days(3);
}

pub struct MaxBufferTimes {}

pub trait MaxBufferTimesTrait {
    // Maximum time between now and the campaign end time.
    const NOW_TO_CAMPAIGN_END_TIME_IN_SECONDS: i64;
    // Maximum time between the campaign end time and the initial payout.
    const CAMPAIGN_END_TIME_TO_INITIAL_PAYOUT_IN_SECONDS: i64;
    // Maximum time between payout phase payout times.
    const PAYOUT_TIME_TO_NEXT_PAYOUT_TIME_IN_SECONDS: i64;
    // Maximum time to claim refunds for a payout phase.
    const PAYOUT_TIME_TO_REFUND_DEADLINE_IN_SECONDS: i64;
}

// Enabled for testing.
#[cfg(feature = "use-test-env")]
impl MaxBufferTimesTrait for MaxBufferTimes {
    const NOW_TO_CAMPAIGN_END_TIME_IN_SECONDS: i64 = 10;
    const CAMPAIGN_END_TIME_TO_INITIAL_PAYOUT_IN_SECONDS: i64 = 10;
    const PAYOUT_TIME_TO_NEXT_PAYOUT_TIME_IN_SECONDS: i64 = 10;
    const PAYOUT_TIME_TO_REFUND_DEADLINE_IN_SECONDS: i64 = 10;
}

// Enabled for non-test builds.
#[cfg(not(feature = "use-test-env"))]
impl MaxBufferTimesTrait for MaxBufferTimes {
    const NOW_TO_CAMPAIGN_END_TIME_IN_SECONDS: i64 = months(6);
    const CAMPAIGN_END_TIME_TO_INITIAL_PAYOUT_IN_SECONDS: i64 = days(14);
    const PAYOUT_TIME_TO_NEXT_PAYOUT_TIME_IN_SECONDS: i64 = months(6);
    const PAYOUT_TIME_TO_REFUND_DEADLINE_IN_SECONDS: i64 = months(3);
}
