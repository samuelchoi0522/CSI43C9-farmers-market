package com.csi43C9.baylor.farmers_market.controller;

import java.util.Objects;

import com.csi43C9.baylor.farmers_market.dto.tokens.TokenRefreshRequest;
import com.csi43C9.baylor.farmers_market.dto.tokens.TokenRefreshResponse;
import com.csi43C9.baylor.farmers_market.exception.TokenException;
import com.csi43C9.baylor.farmers_market.security.UserDetailsImpl;
import com.csi43C9.baylor.farmers_market.security.UserDetailsServiceImpl;
import com.csi43C9.baylor.farmers_market.service.security.RefreshTokenService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.csi43C9.baylor.farmers_market.dto.JwtResponse;
import com.csi43C9.baylor.farmers_market.dto.LoginRequest;
import com.csi43C9.baylor.farmers_market.security.jwt.JwtUtil;

import lombok.AllArgsConstructor;


/**
 * Controller for handling user authentication.
 * This class provides endpoints for authentication-related operations, including user login.
 * It is annotated with {@link RestController}, meaning it is a controller where every method returns a domain object instead of a view.
 */
@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
@AllArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final RefreshTokenService refreshTokenService;
    private final UserDetailsServiceImpl userDetailsService;
    private final JwtUtil jwtUtil;

    /**
     * Authenticates a user based on the provided login request.
     * This method takes the user's login credentials, authenticates them using the {@link AuthenticationManager},
     * and if successful, sets the {@link Authentication} in the {@link SecurityContextHolder}.
     * A JWT token is then generated for the authenticated user.
     *
     * @param loginRequest DTO containing the username and password for authentication.
     * @return a {@link ResponseEntity} containing the {@link JwtResponse} with the JWT token.
     */
    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {

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
     * Refreshes an expired JWT token.
     * @param request the request body containing the refresh token.
     * @return a {@link ResponseEntity} containing the new JWT token.
     */
    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@RequestBody TokenRefreshRequest request) {
        String requestRefreshToken = request.refreshToken();

        return refreshTokenService.findByToken(requestRefreshToken)
                .map(refreshTokenService::verifyExpiration)
                .map(token -> {
                    // Load the user from the DB using the UUID stored in the refresh token
                    UserDetails userDetails = userDetailsService.loadUserById(token.getUser().getId());

                    // Generate a brand new short-lived Access Token
                    String newAccessToken = jwtUtil.generateToken(userDetails);

                    // Return the response
                    return ResponseEntity.ok(new TokenRefreshResponse(newAccessToken, requestRefreshToken));
                })
                .orElseThrow(() -> new TokenException("Refresh token is not in database!", HttpStatus.NOT_FOUND));
    }

}
