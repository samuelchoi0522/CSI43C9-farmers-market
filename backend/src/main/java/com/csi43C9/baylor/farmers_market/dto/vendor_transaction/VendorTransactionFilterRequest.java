package com.csi43C9.baylor.farmers_market.dto.vendor_transaction;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Request DTO for filtering vendor transactions.
 * Designed to be extended with additional filter fields over time.
 */
@Data
@NoArgsConstructor
public class VendorTransactionFilterRequest {

    /**
     * Optional vendor constraint for filter-driven transaction queries.
     */
    private UUID vendorId;

    /**
     * Filters to one exact market date.
     */
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate marketDate;

    /**
     * Inclusive start of a market date range.
     */
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate startMarketDate;

    /**
     * Inclusive end of a market date range.
     */
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate endMarketDate;
}
