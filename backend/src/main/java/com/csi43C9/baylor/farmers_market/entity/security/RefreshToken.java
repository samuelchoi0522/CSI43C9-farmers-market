package com.csi43C9.baylor.farmers_market.entity.security;

import com.csi43C9.baylor.farmers_market.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

/**
 * Entity representing a refresh token in the farmers market system.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RefreshToken {

    /**
     * The unique identifier for the refresh token.
     */
    private UUID id;

    /**
     * The user associated with this refresh token.
     */
    private User user;

    /**
     * A JWT token that can be used to authenticate a user for a short period of time.
     */
    private String token; // A random UUID string

    /**
     * The date and time when the token expires.
     */
    private Instant expiryDate;
}
