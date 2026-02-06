package com.csi43C9.baylor.farmers_market.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.UUID;

/**
 * Entity representing a Vendor in the farmers market system.
 * This class maps directly to the 'vendors' table schema.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Vendor {
    /** The unique identifier stored as binary(16) in the database. */
    private UUID id;

    /** The name of the vendor. */
    private String vendorName;

    /** The primary contact person for the vendor. */
    private String pointPerson;

    /** The contact email address. */
    private String email;

    /** Physical location or address of the vendor. */
    private String location;

    /** Distance in miles from the market. */
    private Integer miles;

    /** Descriptions of products sold by the vendor. */
    private String products;

    /** Whether the vendor is a farmer. */
    private boolean isFarmer;

    /** Whether the vendor sells produce. */
    private boolean isProduce;

    /** Whether the business is woman-owned. */
    private boolean womanOwned;

    /** Whether the business is BIPOC-owned. */
    private boolean bipocOwned;

    /** Whether the business is veteran-owned. */
    private boolean veteranOwned;
}