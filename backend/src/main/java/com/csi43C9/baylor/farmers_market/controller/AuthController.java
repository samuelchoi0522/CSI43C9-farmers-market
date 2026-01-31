package com.csi43C9.baylor.farmers_market.controller;

import com.csi43C9.baylor.farmers_market.dto.JwtResponse;
import com.csi43C9.baylor.farmers_market.dto.LoginRequest;
import com.csi43C9.baylor.farmers_market.security.jwt.JwtUtil;
import lombok.AllArgsConstructor;
import lombok.NonNull;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Objects;


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
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        if (Objects.isNull(userDetails)) {
            return ResponseEntity.badRequest().body("Invalid username or password.");
        }
        String jwt = jwtUtil.generateToken(userDetails);

        return ResponseEntity.ok(new JwtResponse(jwt));
    }


    /**
     * A protected endpoint for testing authentication.
     * This method retrieves the authenticated user's details from the {@link SecurityContextHolder}
     * and returns a personalized greeting. It is used to verify that a user is successfully authenticated.
     *
     * @return a {@link ResponseEntity} with a greeting message to the authenticated user.
     */
    @GetMapping("/hello")
    public ResponseEntity<@NonNull String> hello() {
        UserDetails userDetails = (UserDetails) Objects.requireNonNull(SecurityContextHolder.getContext().getAuthentication()).getPrincipal();
        if (Objects.isNull(userDetails)) {
            return ResponseEntity.badRequest().body("User not authenticated.");
        }
        String username = userDetails.getUsername();
        return ResponseEntity.ok("Hello, " + username + "! This is a protected endpoint.");
    }
}
