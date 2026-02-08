package com.csi43C9.baylor.farmers_market.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Data Transfer Object (DTO) for adding or removing category labels
 * associated with a vendor.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class VendorLabelRequest {

    private List<Long> labelIds;

}
