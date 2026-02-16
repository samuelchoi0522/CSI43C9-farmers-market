package com.csi43C9.baylor.farmers_market.service;

import com.csi43C9.baylor.farmers_market.dto.JwtResponse;
import com.csi43C9.baylor.farmers_market.dto.LoginRequest;
import com.csi43C9.baylor.farmers_market.dto.tokens.TokenRefreshResponse;
import com.csi43C9.baylor.farmers_market.entity.security.RefreshToken;
import com.csi43C9.baylor.farmers_market.exception.TokenException;
import com.csi43C9.baylor.farmers_market.security.UserDetailsImpl;
import com.csi43C9.baylor.farmers_market.security.UserDetailsServiceImpl;
import com.csi43C9.baylor.farmers_market.security.jwt.JwtUtil;
import com.csi43C9.baylor.farmers_market.service.security.RefreshTokenService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link AuthService}.
 */
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private AuthenticationManager authenticationManager;
    @Mock private RefreshTokenService refreshTokenService;
    @Mock private UserDetailsServiceImpl userDetailsService;
    @Mock private JwtUtil jwtUtil;

    @InjectMocks
    private AuthService authService;

    /**
     * Verifies that the service returns a JWT and refresh token on successful authentication.
     */
    @Test
    void authenticateUserReturnsJwtAndRefreshTokenSuccess() {
        // Arrange
        LoginRequest loginRequest = new LoginRequest("testUser", "password");
        UUID userId = UUID.randomUUID();
        UserDetailsImpl mockUserDetails = new UserDetailsImpl(userId, "testUser", "password");

        Authentication mockAuth = mock(Authentication.class);
        when(mockAuth.getPrincipal()).thenReturn(mockUserDetails);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(mockAuth);

        when(jwtUtil.generateToken(mockUserDetails)).thenReturn("fake-jwt-token");
        when(refreshTokenService.createRefreshToken(userId)).thenReturn("fake-refresh-token");

        // Act
        ResponseEntity<?> response = authService.authenticateUser(loginRequest);

        // Assert
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        JwtResponse body = (JwtResponse) response.getBody();
        assertThat(body.getAccessToken()).isEqualTo("fake-jwt-token");
        assertThat(body.getRefreshToken()).isEqualTo("fake-refresh-token");
    }

    /**
     * Verifies that refreshToken() rotates the refresh token successfully.
     */
    @Test
    void refreshTokenRotatesTokenSuccessfully() {
        // Arrange
        String requestToken = "old-refresh-token";
        UUID userId = UUID.randomUUID();

        // Create a mock token that contains the userId directly
        // (Assuming you updated RefreshToken entity to have userId field or User object)
        RefreshToken storedToken = new RefreshToken();
        storedToken.setUserId(userId);

        // Mock finding token
        when(refreshTokenService.findByToken(requestToken)).thenReturn(Optional.of(storedToken));
        when(refreshTokenService.verifyExpiration(storedToken)).thenReturn(storedToken);

        // Mock loading user details for the new JWT
        UserDetailsImpl mockUserDetails = new UserDetailsImpl(userId, "user@test.com", "pass");
        when(userDetailsService.loadUserById(userId)).thenReturn(mockUserDetails);

        // Mock generating new tokens
        when(jwtUtil.generateToken(mockUserDetails)).thenReturn("new-jwt");
        when(refreshTokenService.createRefreshToken(userId)).thenReturn("new-rotated-refresh-token");

        // Act
        ResponseEntity<?> response = authService.refreshToken(requestToken);

        // Assert
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        TokenRefreshResponse body = (TokenRefreshResponse) response.getBody();
        assertThat(body.accessToken()).isEqualTo("new-jwt");
        assertThat(body.refreshToken()).isEqualTo("new-rotated-refresh-token");
    }

    /**
     * Verifies that refreshToken() throws an exception if the token is not found in the database.
     */
    @Test
    void refreshTokenThrowsExceptionIfNotFound() {
        String token = "missing-token";
        when(refreshTokenService.findByToken(token)).thenReturn(Optional.empty());

        TokenException ex = assertThrows(TokenException.class, () ->
                authService.refreshToken(token)
        );

        assertThat(ex.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(ex.getMessage()).contains("not in database");
    }
}
