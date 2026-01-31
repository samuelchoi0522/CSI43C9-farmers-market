package com.csi43C9.baylor.farmers_market.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Data Transfer Object (DTO) for encapsulating user login requests.
 *
 * <p>This class is used to carry the username and password from the client
 * to the server for authentication purposes. It provides a structured way
 * to receive login credentials via API endpoints.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {
    private String username;
    private String password;
}
