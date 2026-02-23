package com.csi43C9.baylor.farmers_market.dto.vendor;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

/**
 * Data Transfer Object (DTO) for adding category labels
 * associated with a vendor.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class VendorLabelRequest {

    @NotEmpty(message = "The list of label IDs cannot be empty.")
    private List<@NotNull(message = "Label ID cannot be null.") Long> labelIds;

}