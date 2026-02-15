package com.csi43C9.baylor.farmers_market.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * Data Transfer Object (DTO) for encapsulating JWT responses.
 */
@Data
@AllArgsConstructor
public class JwtResponse {
    /**
     * The JWT access token.
     */
    private String accessToken;

    /**
     * The JWT refresh token.
     */
    private String refreshToken;

    /**
     * The token type.
     */
    private final String type = "Bearer";
}
