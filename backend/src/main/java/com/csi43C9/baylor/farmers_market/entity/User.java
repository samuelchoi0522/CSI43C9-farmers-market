package com.csi43C9.baylor.farmers_market.entity;

import com.csi43C9.baylor.farmers_market.entity.base.IdentifiableUuid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Entity representing a user in the farmers market system.
 */
@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User implements IdentifiableUuid {
    /**
     * The unique identifier stored as binary(16) in the database.
     */
    private UUID id;

    /**
     * The email address of the user.
     */
    private String email;

    /**
     * The hashed password stored as binary(60) in the database.
     */
    private String passwordHash;
}
