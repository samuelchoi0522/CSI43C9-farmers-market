package com.csi43C9.baylor.farmers_market.security;

import com.csi43C9.baylor.farmers_market.security.jwt.AuthEntryPointJwt;
import com.csi43C9.baylor.farmers_market.security.jwt.JwtAuthFilter;
import com.csi43C9.baylor.farmers_market.security.jwt.JwtUtil;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.util.ArrayList;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/*
 * Integration tests for the SecurityConfig class, focusing on verifying that the
 * Spring Security configuration correctly enforces access control to public and
 * protected API endpoints. These tests utilize `@WebMvcTest` to slice the application
 * context to only the web layer, allowing for efficient testing of HTTP requests
 * and security rules.
 */
@WebMvcTest(controllers = TestController.class) // Focuses Spring Boot tests on the web layer for TestController
// Imports necessary security components to build the security context for testing
@Import({SecurityConfig.class, AuthEntryPointJwt.class, JwtAuthFilter.class})
class SecurityConfigTest {

    @Autowired
    private MockMvc mockMvc; // Used to perform HTTP requests in a test environment

    // Mock beans for services that SecurityConfig depends on, to isolate the security configuration
    @MockitoBean
    private UserDetailsServiceImpl userDetailsService;

    @MockitoBean
    private JwtUtil jwtUtil;


    /**
     * Tests that a public endpoint (`/api/auth/public`) is accessible without any authentication.
     * Expects an HTTP 200 OK status.
     * @throws Exception if an error occurs during the mock MVC request.
     */
    @Test
    void testPublicEndpointIsPermitted() throws Exception {
        mockMvc.perform(get("/api/auth/public"))
                .andExpect(status().isOk());
    }

    /**
     * Tests that a protected endpoint (`/api/protected`) returns an HTTP 401 Unauthorized
     * status when no authentication token is provided.
     * @throws Exception if an error occurs during the mock MVC request.
     */
    @Test
    void testProtectedEndpointIsUnauthorizedWhenNoAuth() throws Exception {
        mockMvc.perform(get("/api/protected"))
                .andExpect(status().isUnauthorized());
    }

    /**
     * Tests that a protected endpoint (`/api/protected`) is accessible (HTTP 200 OK)
     * when a mock authenticated user is present in the security context.
     * `@WithMockUser` simplifies testing by providing a pre-authenticated user.
     * @throws Exception if an error occurs during the mock MVC request.
     */
    @Test
    @WithMockUser // Simulates a logged-in user without needing a real token
    void testProtectedEndpointIsOkWithMockUser() throws Exception {
        mockMvc.perform(get("/api/protected"))
                .andExpect(status().isOk());
    }

    /**
     * Tests that a protected endpoint (`/api/protected`) is accessible (HTTP 200 OK)
     * when a valid JWT token is provided in the Authorization header.
     * Mocks the JwtUtil and UserDetailsServiceImpl to simulate token validation.
     * @throws Exception if an error occurs during the mock MVC request.
     */
    @Test
    void testProtectedEndpointIsOkWithValidJwt() throws Exception {
        String token = "valid-jwt";
        UserDetails userDetails = new User("user", "password", new ArrayList<>());

        // Configure mock JwtUtil and UserDetailsService to simulate a successful token validation
        when(jwtUtil.extractUsername(token)).thenReturn("user");
        when(userDetailsService.loadUserByUsername("user")).thenReturn(userDetails);
        when(jwtUtil.validateToken(token, userDetails)).thenReturn(true);

        mockMvc.perform(get("/api/protected")
                        .header("Authorization", "Bearer " + token)) // Include the valid JWT in the request header
                .andExpect(status().isOk());
    }

    /**
     * Tests that a protected endpoint (`/api/protected`) returns an HTTP 401 Unauthorized
     * status when an invalid JWT token is provided.
     * Mocks the JwtUtil to simulate a failed token validation.
     * @throws Exception if an error occurs during the mock MVC request.
     */
    @Test
    void testProtectedEndpointIsUnauthorizedWithInvalidJwt() throws Exception {
        String token = "invalid-jwt";
        UserDetails userDetails = new User("user", "password", new ArrayList<>());

        // Configure mock JwtUtil and UserDetailsService to simulate a failed token validation
        when(jwtUtil.extractUsername(token)).thenReturn("user");
        when(userDetailsService.loadUserByUsername("user")).thenReturn(userDetails);
        when(jwtUtil.validateToken(any(), any())).thenReturn(false); // Simulate invalid token by returning false for validation

        mockMvc.perform(get("/api/protected")
                        .header("Authorization", "Bearer " + token)) // Include the invalid JWT in the request header
                .andExpect(status().isUnauthorized());
    }
}