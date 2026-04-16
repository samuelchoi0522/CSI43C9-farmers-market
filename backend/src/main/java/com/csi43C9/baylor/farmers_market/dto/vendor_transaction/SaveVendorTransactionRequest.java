package com.csi43C9.baylor.farmers_market.dto.vendor_transaction;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

/**
 * Data Transfer Object representing the request payload for creating or
 * managing a Vendor Transaction within the Farmers Market system.
 */
@Data
@NoArgsConstructor
public class SaveVendorTransactionRequest {

    /**
     * The vendor identifier for the transaction.
     */
    @NotNull(message = "Vendor ID is required")
    private UUID vendorId;

    /**
     * The vendor name captured for the transaction.
     */
    @NotBlank(message = "Vendor name is required")
    private String vendorName;

    /**
     * The market date for the transaction.
     */
    @NotNull(message = "Market date is required")
    private LocalDate marketDate;

    /**
     * Flag indicating if the vendor was present.
     */
    private boolean present;

    /**
     * SNAP total collected.
     */
    private Double snap;

    /**
     * DUFB total collected.
     */
    private Double dufb;

    /**
     * WDFM tokens total collected.
     */
    private Double wdfmTokens;

    /**
     * Voucher total collected.
     */
    private Double voucher;

    /**
     * Reimbursement due for the transaction.
     */
    private Double reimbursementDue;

    /**
     * Reported sales total.
     */
    private Double reportedSales;

    /**
     * Estimated produce sales total.
     */
    private Double estProduceSales;

    /**
     * Estimated number of transactions.
     */
    private Long estNumTransactions;

    /**
     * Percentage of reported sales that are handmade.
     */
    private Double pctHandmade;

    /**
     * Percentage of reported sales that are agricultural.
     */
    private Double pctAgricultural;

    /**
     * Percentage of reported sales that are prepared food.
     */
    private Double pctPreparedFood;

    /**
     * Percentage of reported sales that are cottage goods.
     */
    private Double pctCottageGoods;

    /**
     * Percentage of reported sales that are manufactured.
     */
    private Double pctManufactured;

    /**
     * Flexible payload for dynamic column data.
     */
    private Map<String, Object> customData;
}
