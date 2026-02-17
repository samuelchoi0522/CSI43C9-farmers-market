package com.csi43C9.baylor.farmers_market.entity.base;

import java.util.UUID;

/**
 * Interface for entities using UUIDs (e.g., Vendors, Transactions).
 */
public interface IdentifiableUuid {
    UUID getId();
    void setId(UUID id);
}
