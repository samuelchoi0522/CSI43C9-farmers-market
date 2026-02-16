package com.csi43C9.baylor.farmers_market.repository;

import com.csi43C9.baylor.farmers_market.entity.security.RefreshToken;
import com.csi43C9.baylor.farmers_market.util.UuidUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.jdbc.test.autoconfigure.JdbcTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for {@link RefreshTokenRepository}.
 */
@JdbcTest
@Import(RefreshTokenRepository.class)
class RefreshTokenRepositoryTest {

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    // Used to satisfy the Foreign Key constraint in the database
    private UUID testUserId;

    /**
     * Set up the test environment before each test method.
     */
    @BeforeEach
    void setUp() {
        // 1. Clean the database to ensure no test pollution
        jdbcTemplate.execute("DELETE FROM refresh_tokens");
        jdbcTemplate.execute("DELETE FROM users");

        // 2. Create a dummy User to satisfy the Foreign Key constraint
        testUserId = UUID.randomUUID();
        String sql = "INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)";

        // 3. Insert a dummy user
        jdbcTemplate.update(sql,
                UuidUtils.toBytes(testUserId),
                "test@test.com",
                "hashedpassword"
        );
    }

    /**
     * Test that save() creates a new token if none exists for the given user ID.
     */
    @Test
    void saveCreatesNewToken() {
        String token = "new-token-123";
        Instant expiry = Instant.now().plusSeconds(3600);

        // Act
        refreshTokenRepository.save(testUserId, token, expiry);

        // Assert
        Optional<RefreshToken> found = refreshTokenRepository.findByUserId(testUserId);
        assertThat(found).isPresent();
        assertThat(found.get().getToken()).isEqualTo(token);
    }

    /**
     * Test that save() updates an existing token if one already exists for the given user ID.
     */
    @Test
    void saveUpdatesExistingTokenOnDuplicateKey() {
        // Arrange: Insert initial token
        String initialToken = "token-1";
        refreshTokenRepository.save(testUserId, initialToken, Instant.now());

        // Act: Save AGAIN with the same user ID but new token string
        String newToken = "token-2-updated";
        refreshTokenRepository.save(testUserId, newToken, Instant.now().plusSeconds(3600));

        // Assert: We should still only have 1 row, but with the new value
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM refresh_tokens", Integer.class);
        assertThat(count).isEqualTo(1);

        Optional<RefreshToken> found = refreshTokenRepository.findByUserId(testUserId);
        assertThat(found).isPresent();
        assertThat(found.get().getToken()).isEqualTo(newToken); // Must match the new one
    }

    /**
     * Verifies that findByToken() returns the correct token for the given user ID.
     */
    @Test
    void findByTokenReturnsCorrectToken() {
        String tokenString = "unique-search-token";
        refreshTokenRepository.save(testUserId, tokenString, Instant.now());

        Optional<RefreshToken> result = refreshTokenRepository.findByToken(tokenString);

        assertThat(result).isPresent();
        assertThat(result.get().getUserId()).isEqualTo(testUserId);
    }

    /**
     * Verifies that findByToken() returns an empty Optional if the token is not found.
     */
    @Test
    void findByTokenReturnsEmptyIfNotFound() {
        Optional<RefreshToken> result = refreshTokenRepository.findByToken("non-existent");
        assertThat(result).isEmpty();
    }

    /**
     * Verifies that deleteByUserId() removes the token associated with the given user ID.
     */
    @Test
    void deleteByUserIdRemovesToken() {
        // Arrange
        refreshTokenRepository.save(testUserId, "to-be-deleted", Instant.now());

        // Pre-check
        assertThat(refreshTokenRepository.findByUserId(testUserId)).isPresent();

        // Act
        refreshTokenRepository.deleteByUserId(testUserId);

        // Assert
        assertThat(refreshTokenRepository.findByUserId(testUserId)).isEmpty();
    }
}
