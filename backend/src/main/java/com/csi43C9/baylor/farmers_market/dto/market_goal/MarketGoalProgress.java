package com.csi43C9.baylor.farmers_market.dto.market_goal;

import java.time.LocalDate;

/**
 * A {@link MarketGoal} with actual progress computed from vendor transactions in range.
 */
public record MarketGoalProgress(
        Long id,
        String name,
        LocalDate startDate,
        LocalDate endDate,
        String metric,
        double targetValue,
        double currentValue,
        /** Percent of target achieved; may exceed 100 when the goal is surpassed. */
        double percentTowardGoal
) {
}
