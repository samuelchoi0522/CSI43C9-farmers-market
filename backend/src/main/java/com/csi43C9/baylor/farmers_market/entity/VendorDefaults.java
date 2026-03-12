package com.csi43C9.baylor.farmers_market.entity;

import com.csi43C9.baylor.farmers_market.entity.base.IdentifiableUuid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.UUID;

/**
 * Entity representing default product category percentages for a Vendor.
 * This class maps directly to the 'vendor_defaults' table schema.
 */
@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
public class VendorDefaults implements IdentifiableUuid {
    /** The unique identifier stored as binary(16) in the database. */
    private UUID id;

    /** The ID of the vendor these defaults belong to. */
    private UUID vendorId;

    /** Percentage of handmade goods. */
    @Builder.Default
    private BigDecimal pctHandmade = BigDecimal.ZERO;

    /** Percentage of agricultural goods. */
    @Builder.Default
    private BigDecimal pctAgricultural = BigDecimal.ZERO;

    /** Percentage of prepared food. */
    @Builder.Default
    private BigDecimal pctPreparedFood = BigDecimal.ZERO;

    /** Percentage of cottage goods. */
    @Builder.Default
    private BigDecimal pctCottageGoods = BigDecimal.ZERO;

    /** Percentage of manufactured goods. */
    @Builder.Default
    private BigDecimal pctManufactured = BigDecimal.ZERO;

    /** Default average sale amount for this vendor. */
    @Builder.Default
    private BigDecimal avgSaleAmount = BigDecimal.ZERO;
}
