package com.csi43C9.baylor.farmers_market.security.jwt;

import com.csi43C9.baylor.farmers_market.security.UserDetailsServiceImpl;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import java.io.IOException;
import java.util.ArrayList;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.anyString;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.never;

/*
 * Unit tests for the JwtAuthFilter, which intercepts incoming HTTP requests to validate
 * JWT tokens present in the Authorization header. These tests cover various scenarios
 * including valid tokens, missing tokens, invalid tokens, malformed headers, and
 * exception handling during token processing, ensuring that the security context
 * is correctly updated or left untouched based on the authentication outcome.
 */
@ExtendWith(MockitoExtension.class)
class JwtAuthFilterTest {

    // Mock JwtUtil to control JWT token operations (extracting username, validating token)
    @Mock
    private JwtUtil jwtUtil;

    // Mock UserDetailsServiceImpl to control user details loading
    @Mock
    private UserDetailsServiceImpl userDetailsService;

    // Mock HttpServletRequest to simulate incoming request properties (e.g., headers)
    @Mock
    private HttpServletRequest request;

    // Mock HttpServletResponse as it's part of the filter chain
    @Mock
    private HttpServletResponse response;

    // Mock FilterChain to verify that the filter proceeds to the next in the chain
    @Mock
    private FilterChain filterChain;

    // Inject mocks into JwtAuthFilter instance
    @InjectMocks
    private JwtAuthFilter jwtAuthFilter;

    // UserDetails object to be returned by mock userDetailsService
    private UserDetails userDetails;

    /**
     * Set up common test data before each test.
     * Initializes a UserDetails object and clears the SecurityContextHolder to ensure
     * a clean state for each test.
     */
    @BeforeEach
    void setUp() {
        userDetails = new User("testuser", "password", new ArrayList<>());
        SecurityContextHolder.clearContext(); // Clear security context before each test
    }

    /**
     * Clears the SecurityContextHolder after each test to prevent side effects
     * on subsequent tests.
     */
    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext(); // Clear security context after each test
    }

    /**
     * Tests the scenario where a valid JWT token is present in the Authorization header.
     * Verifies that:
     * - The token is processed, username extracted, user details loaded, and token validated.
     * - The SecurityContextHolder is updated with a valid authentication.
     * - The filter chain proceeds.
     * @throws ServletException
     * @throws IOException
     */
    @Test
    void testDoFilterInternalValidJwt() throws ServletException, IOException {
        // Given: A valid JWT token in the Authorization header
        String token = "valid.jwt.token";
        String authHeader = "Bearer " + token;
        when(request.getHeader("Authorization")).thenReturn(authHeader);
        when(jwtUtil.extractUsername(token)).thenReturn("testuser");
        when(userDetailsService.loadUserByUsername("testuser")).thenReturn(userDetails);
        when(jwtUtil.validateToken(token, userDetails)).thenReturn(true);

        // When: The filter processes the request
        jwtAuthFilter.doFilterInternal(request, response, filterChain);

        // Then: Verify authentication and filter chain progression
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNotNull();
        assertThat(SecurityContextHolder.getContext().getAuthentication().getName()).isEqualTo("testuser");
        verify(filterChain, times(1)).doFilter(request, response);
    }

    /**
     * Tests the scenario where no JWT token is present (missing Authorization header).
     * Verifies that:
     * - No authentication is set in the SecurityContextHolder.
     * - The filter chain proceeds without attempting JWT processing.
     * @throws ServletException
     * @throws IOException
     */
    @Test
    void testDoFilterInternalNoJwt() throws ServletException, IOException {
        // Given: No Authorization header
        when(request.getHeader("Authorization")).thenReturn(null);

        // When: The filter processes the request
        jwtAuthFilter.doFilterInternal(request, response, filterChain);

        // Then: Verify no authentication and filter chain progression
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain, times(1)).doFilter(request, response);
    }

    /**
     * Tests the scenario where an invalid JWT token is provided (e.g., validation fails).
     * Verifies that:
     * - No authentication is set in the SecurityContextHolder.
     * - The filter chain proceeds.
     * @throws ServletException
     * @throws IOException
     */
    @Test
    void testDoFilterInternalInvalidJwt() throws ServletException, IOException {
        // Given: An invalid JWT token (validation returns false)
        String token = "invalid.jwt.token";
        String authHeader = "Bearer " + token;
        when(request.getHeader("Authorization")).thenReturn(authHeader);
        when(jwtUtil.extractUsername(token)).thenReturn("testuser");
        when(userDetailsService.loadUserByUsername("testuser")).thenReturn(userDetails);
        when(jwtUtil.validateToken(token, userDetails)).thenReturn(false); // Simulate invalid token

        // When: The filter processes the request
        jwtAuthFilter.doFilterInternal(request, response, filterChain);

        // Then: Verify no authentication and filter chain progression
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain, times(1)).doFilter(request, response);
    }

    /**
     * Tests the scenario where the Authorization header is present but malformed
     * (e.g., "Bearer" token is not correctly separated by a space).
     * Verifies that:
     * - No authentication is set in the SecurityContextHolder.
     * - The filter chain proceeds without attempting JWT processing.
     * @throws ServletException
     * @throws IOException
     */
    @Test
    void testDoFilterInternalMalformedHeader() throws ServletException, IOException {
        // Given: A malformed Authorization header
        String authHeader = "BearerTokenWithoutSpace";
        when(request.getHeader("Authorization")).thenReturn(authHeader);

        // When: The filter processes the request
        jwtAuthFilter.doFilterInternal(request, response, filterChain);

        // Then: Verify no authentication and filter chain progression
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain, times(1)).doFilter(request, response);
    }

    /**
     * Tests the scenario where an exception occurs during JWT processing (e.g., while extracting username).
     * Verifies that:
     * - No authentication is set in the SecurityContextHolder.
     * - The filter chain proceeds, allowing subsequent filters/handlers to manage the error.
     * @throws ServletException
     * @throws IOException
     */
    @Test
    void testDoFilterInternalExceptionDuringProcessing() throws ServletException, IOException {
        // Given: A valid-looking token, but jwtUtil throws an exception during processing
        String token = "valid.jwt.token";
        String authHeader = "Bearer " + token;
        when(request.getHeader("Authorization")).thenReturn(authHeader);
        when(jwtUtil.extractUsername(token)).thenThrow(new RuntimeException("JWT parsing error")); // Simulate exception

        // When: The filter processes the request
        jwtAuthFilter.doFilterInternal(request, response, filterChain);

        // Then: Verify no authentication and filter chain progression
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain, times(1)).doFilter(request, response);
    }

    /**
     * Tests the scenario where a user is already authenticated in the SecurityContextHolder
     * before the JwtAuthFilter runs.
     * Verifies that:
     * - The existing authentication is preserved.
     * - JwtUtil and UserDetailsService are not called, as authentication is already present.
     * - The filter chain proceeds.
     * @throws ServletException
     * @throws IOException
     */
    @Test
    void testDoFilterInternalAlreadyAuthenticated() throws ServletException, IOException {
        // Given: An existing authentication in the SecurityContextHolder
        SecurityContextHolder.getContext().setAuthentication(mock(org.springframework.security.core.Authentication.class));

        String token = "valid.jwt.token";
        String authHeader = "Bearer " + token;
        when(request.getHeader("Authorization")).thenReturn(authHeader);
        when(jwtUtil.extractUsername(token)).thenReturn("testuser"); // Mock this, though it shouldn't be called

        // When: The filter processes the request
        jwtAuthFilter.doFilterInternal(request, response, filterChain);

        // Then: Verify that UserDetailsService was NOT called and filter chain proceeded
        verify(userDetailsService, never()).loadUserByUsername(anyString());
        verify(filterChain, times(1)).doFilter(request, response);
    }
}
