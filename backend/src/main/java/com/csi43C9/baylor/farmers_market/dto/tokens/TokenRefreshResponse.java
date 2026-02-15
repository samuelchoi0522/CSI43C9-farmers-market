package com.csi43C9.baylor.farmers_market.dto.tokens;

import jakarta.validation.constraints.NotBlank;

/**
 * Data Transfer Object (DTO) for encapsulating JWT refresh responses.
 * @param accessToken the new access token
 * @param refreshToken the new refresh token
 * @param tokenType the token type
 */
public record TokenRefreshResponse(
        @NotBlank String accessToken,
        @NotBlank String refreshToken,
        String tokenType
) {
    public TokenRefreshResponse(String accessToken, String refreshToken) {
        this(accessToken, refreshToken, "Bearer");
    }
}
