package com.csi43C9.baylor.farmers_market.dto.vendor;

import com.csi43C9.baylor.farmers_market.entity.Vendor;
import com.csi43C9.baylor.farmers_market.entity.VendorDefaults;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for returning vendor information with optional nested resources.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VendorResponse {
    private Vendor vendor;
    private VendorDefaults defaults;
}
