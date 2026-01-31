package com.csi43C9.baylor.farmers_market.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Data Transfer Object (DTO) for encapsulating the JWT access token
 * sent to the client after a successful authentication process.
 *
 * <p>This class serves as a simple structure to hold the generated
 * JWT string, allowing for clear and standardized communication of
 * authentication tokens within the application's API responses.
 * It is primarily used by authentication controllers to return
 * the token to the user's browser or client application.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class JwtResponse {
    private String accessToken;
}
