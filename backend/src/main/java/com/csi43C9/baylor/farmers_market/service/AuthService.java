package com.csi43C9.baylor.farmers_market.service;

import com.csi43C9.baylor.farmers_market.dto.JwtResponse;
import com.csi43C9.baylor.farmers_market.dto.LoginRequest;
import com.csi43C9.baylor.farmers_market.dto.tokens.TokenRefreshResponse;
import com.csi43C9.baylor.farmers_market.exception.TokenException;
import com.csi43C9.baylor.farmers_market.security.UserDetailsImpl;
import com.csi43C9.baylor.farmers_market.security.UserDetailsServiceImpl;
import com.csi43C9.baylor.farmers_market.security.jwt.JwtUtil;
import com.csi43C9.baylor.farmers_market.service.security.RefreshTokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.util.Objects;

/**
 * Service class for authentication and token management.
 */
@Service
@RequiredArgsConstructor
public class AuthService {
    private final AuthenticationManager authenticationManager;
    private final RefreshTokenService refreshTokenService;
    private final UserDetailsServiceImpl userDetailsService;
    private final JwtUtil jwtUtil;

    /**
     * Authenticates a user and generates a JWT token.
     * @param loginRequest the login credentials
     * @return a {@link ResponseEntity} containing the JWT token and refresh token
     */
    public ResponseEntity<?> authenticateUser(LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        if (Objects.isNull(userDetails)) {
            return ResponseEntity.badRequest().body("Invalid username or password.");
        }

        // Generate both JWTs
        String jwt = jwtUtil.generateToken(userDetails);
        String refreshToken = refreshTokenService.createRefreshToken(userDetails.getId());

        return ResponseEntity.ok(new JwtResponse(jwt, refreshToken));
    }

    /**
     * Refreshes an expired JWT token by generating a new short-lived Access Token and rotating the Refresh Token.
     * @param requestToken the refresh token to be refreshed
     * @return a {@link ResponseEntity} containing the new JWT token and refresh token
     */
    public ResponseEntity<?> refreshToken(String requestToken) {
        return refreshTokenService.findByToken(requestToken)
                .map(refreshTokenService::verifyExpiration)
                .map(token -> {
                    // Load the user from the DB using the UUID stored in the refresh token
                    UserDetails userDetails = userDetailsService.loadUserById(token.getUserId());

                    // Generate a brand new short-lived Access Token
                    String newAccessToken = jwtUtil.generateToken(userDetails);

                    // Rotate the refresh token
                    String newRefreshToken = refreshTokenService.createRefreshToken(token.getUserId());

                    // Return the response
                    return ResponseEntity.ok(new TokenRefreshResponse(newAccessToken, newRefreshToken));
                })
                .orElseThrow(() -> new TokenException("Refresh token is not in database!", HttpStatus.NOT_FOUND));
    }
}
