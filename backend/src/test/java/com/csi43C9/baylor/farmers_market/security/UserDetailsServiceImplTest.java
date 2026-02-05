package com.csi43C9.baylor.farmers_market.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import static org.assertj.core.api.AssertionsForClassTypes.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/*
 * Unit tests for the UserDetailsServiceImpl, which is responsible for loading user-specific
 * data during the authentication process. These tests verify that the service correctly
 * retrieves user details for existing users and throws the appropriate exceptions for
 * non-existent users, ensuring proper integration with Spring Security.
 */
class UserDetailsServiceImplTest {

    private UserDetailsServiceImpl userDetailsService;

    /**
     * Set up a new instance of UserDetailsServiceImpl before each test.
     */
    @BeforeEach
    void setUp() {
        userDetailsService = new UserDetailsServiceImpl();
    }

    /**
     * Tests the scenario where a user with a given username is found by the service.
     * Verifies that the returned UserDetails object is not null, contains the correct username,
     * and that the password is a non-null, BCrypt-encrypted string matching the expected password.
     */
    @Test
    void testLoadUserByUsernameUserFound() {
        UserDetails userDetails = userDetailsService.loadUserByUsername("user");
        assertThat(userDetails).isNotNull();
        assertThat(userDetails.getUsername()).isEqualTo("user");
        assertThat(userDetails.getPassword()).isNotNull();

        // Verify that the password stored in UserDetails is correctly BCrypt-encrypted
        // and matches the expected raw password "password".
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        assertTrue(encoder.matches("password", userDetails.getPassword()));
    }

    /**
     * Tests the scenario where a user with a non-existent username is requested.
     * Verifies that a UsernameNotFoundException is thrown, indicating the user could not be found.
     */
    @Test
    void testLoadUserByUsernameUserNotFound() {
        assertThrows(UsernameNotFoundException.class, () -> {
            userDetailsService.loadUserByUsername("nonexistentuser");
        });
    }

    /**
     * Tests that when a user is not found, the UsernameNotFoundException contains the
     * expected error message, which includes the username that was not found.
     */
    @Test
    void testLoadUserByUsernameUserNotFoundMessage() {
        String username = "nonexistentuser";
        UsernameNotFoundException exception = assertThrows(UsernameNotFoundException.class, () -> {
            userDetailsService.loadUserByUsername(username);
        });
        assertThat(exception.getMessage()).isEqualTo("User not found with username: " + username);
    }
}
