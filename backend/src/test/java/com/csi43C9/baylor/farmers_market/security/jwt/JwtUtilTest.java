package com.csi43C9.baylor.farmers_market.security.jwt;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.context.TestPropertySource;
import org.springframework.util.ReflectionUtils;

import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.Date;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

/*
 * Unit tests for the JwtUtil class, which handles JWT token generation, extraction,
 * and validation. These tests ensure the correct behavior of JWT-related operations,
 * including token creation, parsing claims, and various validation scenarios
 * such as token expiration and malformation.
 */
@SpringBootTest
@TestPropertySource(locations = "classpath:application.properties")
class JwtUtilTest {

    @Autowired
    private JwtUtil jwtUtil;

    private UserDetails userDetails;

    /**
     * Set up common test data before each test.
     * Initializes a UserDetails object to represent a principal for token operations.
     */
    @BeforeEach
    void setUp() {
        userDetails = User.withUsername("testuser")
                          .password("password") // Password is not used in JwtUtil but required by User.withUsername
                          .authorities(new ArrayList<>())
                          .build();
    }

    /**
     * Tests that a JWT token can be successfully generated for a given UserDetails object.
     * Verifies that the generated token is not null or empty.
     */
    @Test
    void testGenerateToken() {
        String token = jwtUtil.generateToken(userDetails);
        assertThat(token).isNotNull().isNotEmpty();
    }

    /**
     * Tests the extraction of the username from a generated JWT token.
     * Ensures that the extracted username matches the original username used for token generation.
     */
    @Test
    void testExtractUsername() {
        String token = jwtUtil.generateToken(userDetails);
        String username = jwtUtil.extractUsername(token);
        assertThat(username).isEqualTo("testuser");
    }

    /**
     * Tests the extraction of the expiration date from a generated JWT token.
     * Verifies that the extracted expiration date is in the future.
     */
    @Test
    void testExtractExpiration() {
        String token = jwtUtil.generateToken(userDetails);
        Date expiration = jwtUtil.extractExpiration(token);
        assertThat(expiration).isAfter(new Date());
    }

    /**
     * Tests the validation of a valid JWT token against the correct UserDetails.
     * Asserts that the token is considered valid.
     */
    @Test
    void testValidateTokenValid() {
        String token = jwtUtil.generateToken(userDetails);
        assertThat(jwtUtil.validateToken(token, userDetails)).isTrue();
    }

    /**
     * Tests the validation of a JWT token when the provided UserDetails
     * has a different username than the one embedded in the token.
     * Asserts that the token is considered invalid in this scenario.
     */
    @Test
    void testValidateTokenInvalidUsername() {
        String token = jwtUtil.generateToken(userDetails);
        UserDetails differentUser = User.withUsername("differentuser")
                                        .password("password")
                                        .authorities(new ArrayList<>())
                                        .build();
        assertThat(jwtUtil.validateToken(token, differentUser)).isFalse();
    }

    /**
     * Tests the validation of an expired JWT token.
     * This test uses reflection to temporarily set a very short expiration time for the JwtUtil,
     * generates a token, waits for it to expire, and then attempts to validate it.
     * It asserts that an ExpiredJwtException is thrown.
     *
     * @throws Exception if Thread.sleep is interrupted or reflection fails.
     */
    @Test
    void testValidateTokenExpired() throws Exception {
        // Use reflection to set a very short expiration time (1 millisecond) for the JwtUtil instance.
        // This is necessary to reliably test token expiration without waiting for a long period.
        Field expirationField = ReflectionUtils.findField(JwtUtil.class, "jwtExpirationMs");
        assertNotNull(expirationField); // Ensure the field is found
        ReflectionUtils.makeAccessible(expirationField); // Make the private field accessible
        ReflectionUtils.setField(expirationField, jwtUtil, 1); // Set expiration to 1ms

        String token = jwtUtil.generateToken(userDetails);

        // Wait for the token to expire. A small delay ensures the token is indeed expired.
        Thread.sleep(5);

        // Reset the expiration time to its original value to avoid affecting other tests.
        ReflectionUtils.setField(expirationField, jwtUtil, 3600000); // Assuming original was 1 hour

        // Attempt to validate the expired token and assert that an ExpiredJwtException is thrown.
        Exception exception = assertThrows(ExpiredJwtException.class, () -> {
            jwtUtil.validateToken(token, userDetails);
        });

        assertThat(exception).isInstanceOf(ExpiredJwtException.class);
    }

    /**
     * Tests the behavior when validating a malformed JWT token (e.g., incorrect format).
     * Asserts that a MalformedJwtException is thrown.
     */
    @Test
    void testValidateTokenMalformed() {
        String malformedToken = "this.is.not.a.jwt";
        assertThrows(MalformedJwtException.class, () -> {
            jwtUtil.validateToken(malformedToken, userDetails);
        });
    }

    /**
     * Tests the behavior when trying to extract claims from a token with an invalid signature.
     * This simulates a token that has been tampered with.
     * Asserts that an io.jsonwebtoken.security.SignatureException is thrown.
     */
    @Test
    void testValidateTokenInvalidSignature() {
        String token = jwtUtil.generateToken(userDetails);
        // Manipulate the token to have an invalid signature part
        String[] parts = token.split("\\.");
        String invalidToken = parts[0] + "." + parts[1] + ".invalidSignature"; // Corrupt the signature

        // Attempt to extract claims (which implicitly validates the signature) and assert the exception.
        assertThrows(io.jsonwebtoken.security.SignatureException.class, () -> {
            jwtUtil.extractAllClaims(invalidToken);
        });
    }
}