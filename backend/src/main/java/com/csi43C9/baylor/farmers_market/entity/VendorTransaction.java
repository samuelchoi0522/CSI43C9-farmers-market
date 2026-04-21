package com.csi43C9.baylor.farmers_market.entity;

import com.csi43C9.baylor.farmers_market.entity.base.IdentifiableUuid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

/**
 * Entity representing a vendor transaction record in the farmers market system.
 * This class maps directly to the 'vendor_transactions' table schema.
 */
@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
public class VendorTransaction implements IdentifiableUuid {
    /** The unique identifier stored as binary(16) in the database. */
    private UUID id;

    /** The vendor identifier stored as binary(16) in the database. */
    private UUID vendorId;

    /** The vendor name captured at the time of the transaction. */
    private String vendorName;

    /** The market date for the transaction. */
    private LocalDate marketDate;

    /** Whether the vendor was present on the market date. */
    private boolean present;

    /** SNAP total collected. */
    private Double snap;

    /** DUFB total collected. */
    private Double dufb;

    /** WDFM tokens total collected. */
    private Double wdfmTokens;

    /** Voucher total collected. */
    private Double voucher;

    /** Reimbursement due for the transaction. */
    private Double reimbursementDue;

    /** Reported sales total. */
    private Double reportedSales;

    /** Estimated produce sales total. */
    private Double estProduceSales;

    /** Estimated number of transactions. */
    private Long estNumTransactions;

    /** Percentage of reported sales that are handmade. */
    private Double pctHandmade;

    /** Percentage of reported sales that are agricultural. */
    private Double pctAgricultural;

    /** Percentage of reported sales that are prepared food. */
    private Double pctPreparedFood;

    /** Percentage of reported sales that are cottage goods. */
    private Double pctCottageGoods;

    /** Percentage of reported sales that are manufactured. */
    private Double pctManufactured;

    /** Average sale amount override for this transaction. */
    private Double avgSaleAmount;

    /** Flexible payload for dynamic column data. */
    private Map<String, Object> customData;

    /** Timestamp for record creation. */
    private LocalDateTime createdAt;

    /** Timestamp for last record update. */
    private LocalDateTime updatedAt;
}
