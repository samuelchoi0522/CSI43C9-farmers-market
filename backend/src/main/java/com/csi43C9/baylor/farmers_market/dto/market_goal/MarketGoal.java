package com.csi43C9.baylor.farmers_market.dto.market_goal;

import java.time.LocalDate;

/**
 * A user-defined market performance goal over a date range.
 *
 * @param metric      REPORTED_SALES, TOKEN_VOLUME, or ACTIVE_VENDOR_ATTENDANCE
 * @param targetValue target amount (currency for monetary metrics, count for transactions)
 */
public record MarketGoal(
        Long id,
        String name,
        LocalDate startDate,
        LocalDate endDate,
        String metric,
        double targetValue
) {
}
