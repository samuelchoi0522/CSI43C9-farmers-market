package com.csi43C9.baylor.farmers_market.dto.custom_column;

/**
 * Data Transfer Object representing the configuration of a custom column.
 *
 * @param name       the exact JSON key expected for this column
 * @param type       the data type (text or number)
 * @param isRequired whether the transaction must contain a value for this column
 */
public record CustomColumnMetadata(
        String name,
        String type,
        boolean isRequired
) {
}