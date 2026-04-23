package com.csi43C9.baylor.farmers_market.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Entity representing market day statistics for a specific date.
 */
@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MarketDayData {
    /** The market date this data belongs to (Primary Key). */
    private LocalDate marketDate;

    /** Number of SNAP Token Transactions. */
    private Integer snapTokenTransactions;

    /** Total SNAP Tokens purchased. */
    private Double snapTokensPurchased;

    /** Total SNAP Tokens redeemed. */
    private Double snapTokensRedeemed;

    /** Number of DUFB Token Transactions. */
    private Integer dufbTokenTransactions;

    /** Total DUFB Tokens distributed. */
    private Double dufbTokensDistributed;

    /** Total DUFB Tokens redeemed. */
    private Double dufbTokensRedeemed;

    /** Number of WDFM Token Transactions. */
    private Integer wdfmTokenTransactions;

    /** Total WDFM Tokens purchased. */
    private Double wdfmTokensPurchased;

    /** Gift Cards Redeemed for Tokens. */
    private Double giftCardsRedeemed;

    /** WDFM Tokens for Market Meals. */
    private Double wdfmTokensForMarketMeals;

    /** Total WDFM Tokens redeemed. */
    private Double wdfmTokensRedeemed;

    /** Timestamp for record creation. */
    private LocalDateTime createdAt;

    /** Timestamp for last record update. */
    private LocalDateTime updatedAt;
}
