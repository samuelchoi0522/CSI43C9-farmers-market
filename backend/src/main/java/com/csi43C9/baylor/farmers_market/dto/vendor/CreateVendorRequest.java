package com.csi43C9.baylor.farmers_market.dto.vendor;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Data Transfer Object representing the request payload for creating or
 * managing a Vendor within the Farmers Market system.
 * <p>
 * This class captures the business details and diversity status of a vendor,
 * ensuring that essential contact and identification information is validated
 * before processing.
 * </p>
 */
@Data
public class CreateVendorRequest {

    /**
     * The unique business name of the vendor.
     * This field is mandatory for creation.
     */
    @NotBlank(message = "Vendor name is required")
    private String vendorName;

    /**
     * The name of the primary contact person for the vendor.
     */
    private String pointPerson;

    /**
     * The primary contact email address for the vendor.
     * Must follow a valid email format (e.g., user@example.com).
     */
    @Email(message = "Valid email is required")
    private String email;

    /**
     * The physical location or primary address of the vendor operations.
     */
    private String location;

    /**
     * The approximate distance in miles from the market location.
     */
    private Integer miles;

    /**
     * A description or list of products provided by the vendor (e.g., "Honey, Jam, Bread").
     */
    private String products;

    /**
     * Flag indicating if the vendor is a primary farmer/producer.
     */
    private boolean isFarmer;

    /**
     * Flag indicating if the vendor primarily sells produce.
     */
    private boolean isProduce;

    /**
     * Flag indicating if the vendor is active at the market.
     */
    private boolean isActive;

    /**
     * Diversity indicator: True if the business is woman-owned.
     */
    private boolean womanOwned;

    /**
     * Diversity indicator: True if the business is BIPOC-owned.
     */
    private boolean bipocOwned;

    /**
     * Diversity indicator: True if the business is veteran-owned.
     */
    private boolean veteranOwned;
}
