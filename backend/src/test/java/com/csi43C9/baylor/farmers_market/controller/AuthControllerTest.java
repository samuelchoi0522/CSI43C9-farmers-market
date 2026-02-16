package com.csi43C9.baylor.farmers_market.controller;

import com.csi43C9.baylor.farmers_market.dto.JwtResponse;
import com.csi43C9.baylor.farmers_market.dto.LoginRequest;
import com.csi43C9.baylor.farmers_market.dto.tokens.TokenRefreshRequest;
import com.csi43C9.baylor.farmers_market.dto.tokens.TokenRefreshResponse;
import com.csi43C9.baylor.farmers_market.service.AuthService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.doReturn;

/**
 * Unit tests for {@link AuthController}.
 */
@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private AuthService authService;

    @InjectMocks
    private AuthController authController;

    /**
     * Verifies that authenticateUser() delegates to the AuthService.
     */
    @Test
    void authenticateUserDelegatesToAuthService() {
        // Arrange
        LoginRequest loginRequest = new LoginRequest("user", "pass");
        JwtResponse expectedResponse = new JwtResponse("jwt-token", "refresh-token");

        // Mock AuthService to return the expected response
        doReturn(ResponseEntity.ok(expectedResponse))
                .when(authService).authenticateUser(loginRequest);

        // Act
        ResponseEntity<?> response = authController.authenticateUser(loginRequest);

        // Assert
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo(expectedResponse);
    }

    /**
     * Verifies that refreshToken() delegates to the AuthService.
     */
    @Test
    void refreshTokenDelegatesToAuthService() {
        // Arrange
        String requestToken = "refresh-123";
        TokenRefreshRequest request = new TokenRefreshRequest(requestToken);
        TokenRefreshResponse expectedResponse = new TokenRefreshResponse("new-jwt", "new-refresh");

        // Mock AuthService to return the expected response
        doReturn(ResponseEntity.ok(expectedResponse))
                .when(authService).refreshToken(requestToken);

        // Act
        ResponseEntity<?> response = authController.refreshToken(request);

        // Assert
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo(expectedResponse);
    }
}
