package com.csi43C9.baylor.farmers_market.dto.vendor_transaction;

import java.math.BigDecimal;

/**
 * Data Transfer Object representing the calculated revenue breakdown.
 *
 * @param handmade     the total handmade revenue
 * @param agricultural the total agricultural revenue
 * @param prepared     the total prepared food revenue
 * @param cottage      the total cottage goods revenue
 * @param manufactured the total manufactured goods revenue
 * @param totalSales   the complete total sales
 */
public record RevenueBreakdown(
        BigDecimal handmade,
        BigDecimal agricultural,
        BigDecimal prepared,
        BigDecimal cottage,
        BigDecimal manufactured,
        BigDecimal totalSales
) {
}
