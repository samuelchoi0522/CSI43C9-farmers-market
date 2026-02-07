package com.csi43C9.baylor.farmers_market.dto.vendor;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateVendorRequest {
    @NotBlank(message = "Vendor name is required")
    private String vendorName;

    private String pointPerson;
    @Email(message = "Valid email is required")
    private String email;

    private String location;
    private Integer miles;
    private String products;
    private boolean isFarmer;
    private boolean isProduce;
    private boolean womanOwned;
    private boolean bipocOwned;
    private boolean veteranOwned;
}