package com.csi43C9.baylor.farmers_market.dto.vendor;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Data Transfer Object representing the request payload for creating or
 * managing Vendor product category percentage defaults.
 */
@Data
@NoArgsConstructor
public class SaveVendorDefaultsRequest {

    /**
     * The ID of the vendor these defaults belong to.
     */
    @NotNull(message = "Vendor ID is required")
    private UUID vendorId;

    /**
     * Percentage of handmade goods.
     */
    @DecimalMin(value = "0.0", message = "Handmade percentage must be at least 0.0")
    @DecimalMax(value = "100.0", message = "Handmade percentage must be at most 100.0")
    private BigDecimal pctHandmade;

    /**
     * Percentage of agricultural goods.
     */
    @DecimalMin(value = "0.0", message = "Agricultural percentage must be at least 0.0")
    @DecimalMax(value = "100.0", message = "Agricultural percentage must be at most 100.0")
    private BigDecimal pctAgricultural;

    /**
     * Percentage of prepared food.
     */
    @DecimalMin(value = "0.0", message = "Prepared food percentage must be at least 0.0")
    @DecimalMax(value = "100.0", message = "Prepared food percentage must be at most 100.0")
    private BigDecimal pctPreparedFood;

    /**
     * Percentage of cottage goods.
     */
    @DecimalMin(value = "0.0", message = "Cottage goods percentage must be at least 0.0")
    @DecimalMax(value = "100.0", message = "Cottage goods percentage must be at most 100.0")
    private BigDecimal pctCottageGoods;

    /**
     * Percentage of manufactured goods.
     */
    @DecimalMin(value = "0.0", message = "Manufactured percentage must be at least 0.0")
    @DecimalMax(value = "100.0", message = "Manufactured percentage must be at most 100.0")
    private BigDecimal pctManufactured;

    /**
     * Default average sale amount.
     */
    private Double avgSaleAmount;
}
