package com.csi43C9.baylor.farmers_market.controller;

import com.csi43C9.baylor.farmers_market.dto.JwtResponse;
import com.csi43C9.baylor.farmers_market.dto.LoginRequest;
import com.csi43C9.baylor.farmers_market.dto.tokens.TokenRefreshRequest;
import com.csi43C9.baylor.farmers_market.dto.tokens.TokenRefreshResponse;
import com.csi43C9.baylor.farmers_market.entity.User;
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
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link AuthController}.
 */
@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock private AuthenticationManager authenticationManager;
    @Mock private RefreshTokenService refreshTokenService;
    @Mock private UserDetailsServiceImpl userDetailsService;
    @Mock private JwtUtil jwtUtil;

    @InjectMocks
    private AuthController authController;

    /**
     * Verifies that the authentication endpoint returns a JWT and refresh token on successful authentication.
     */
    @Test
    void authenticateUserReturnsJwtAndRefreshToken() {
        // Arrange
        LoginRequest loginRequest = new LoginRequest("testUser", "password");
        UUID userId = UUID.randomUUID();

        // Mock UserDetails
        UserDetailsImpl mockUserDetails = new UserDetailsImpl(userId, "testUser", "password");

        // Mock Authentication
        Authentication mockAuth = mock(Authentication.class);
        when(mockAuth.getPrincipal()).thenReturn(mockUserDetails);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(mockAuth);

        // Mock Token Generation
        when(jwtUtil.generateToken(mockUserDetails)).thenReturn("fake-jwt-token");
        when(refreshTokenService.createRefreshToken(userId)).thenReturn("fake-refresh-token");

        // Act
        ResponseEntity<?> response = authController.authenticateUser(loginRequest);

        // Assert
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        JwtResponse body = (JwtResponse) response.getBody();
        assertThat(body.getAccessToken()).isEqualTo("fake-jwt-token");
        assertThat(body.getRefreshToken()).isEqualTo("fake-refresh-token");
    }

    /**
     * Verifies that the refresh token endpoint returns a new JWT and refresh token on successful rotation.
     */
    @Test
    void refreshTokenRotatesTokenSuccessfully() {
        // Arrange
        String requestToken = "old-refresh-token";
        TokenRefreshRequest request = new TokenRefreshRequest(requestToken);
        UUID userId = UUID.randomUUID();

        User user = new User();
        user.setId(userId);
        user.setEmail("user@test.com");

        RefreshToken storedToken = new RefreshToken();
        storedToken.setUser(user);

        // Mock finding token
        when(refreshTokenService.findByToken(requestToken)).thenReturn(Optional.of(storedToken));
        // Mock verifying expiration (returns token if valid)
        when(refreshTokenService.verifyExpiration(storedToken)).thenReturn(storedToken);

        // Mock loading user
        UserDetailsImpl mockUserDetails = new UserDetailsImpl(userId, "user@test.com", "pass");
        when(userDetailsService.loadUserById(userId)).thenReturn(mockUserDetails);

        // Mock generating new tokens
        when(jwtUtil.generateToken(mockUserDetails)).thenReturn("new-jwt");
        when(refreshTokenService.createRefreshToken(userId)).thenReturn("new-rotated-refresh-token");

        // Act
        ResponseEntity<?> response = authController.refreshToken(request);

        // Assert
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        TokenRefreshResponse body = (TokenRefreshResponse) response.getBody();
        assertThat(body.accessToken()).isEqualTo("new-jwt");
        assertThat(body.refreshToken()).isEqualTo("new-rotated-refresh-token"); // Verify rotation
    }

    /**
     * Verifies that refreshToken() throws a TokenException if the token is missing from the database.
     */
    @Test
    void refreshTokenThrowsNotFoundIfTokenMissing() {
        TokenRefreshRequest request = new TokenRefreshRequest("missing-token");
        when(refreshTokenService.findByToken("missing-token")).thenReturn(Optional.empty());

        TokenException ex = assertThrows(TokenException.class, () ->
                authController.refreshToken(request)
        );

        assertThat(ex.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(ex.getMessage()).contains("not in database");
    }
}
