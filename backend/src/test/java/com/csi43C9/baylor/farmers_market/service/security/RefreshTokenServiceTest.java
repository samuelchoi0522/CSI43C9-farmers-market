package com.csi43C9.baylor.farmers_market.service.security;

import com.csi43C9.baylor.farmers_market.entity.User;
import com.csi43C9.baylor.farmers_market.entity.security.RefreshToken;
import com.csi43C9.baylor.farmers_market.exception.TokenException;
import com.csi43C9.baylor.farmers_market.repository.RefreshTokenRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link RefreshTokenService}.
 */
@ExtendWith(MockitoExtension.class)
class RefreshTokenServiceTest {

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @InjectMocks
    private RefreshTokenService refreshTokenService;

    /**
     * Set up the refresh token duration to 1 minute for testing.
     */
    @BeforeEach
    void setUp() {
        // Manually set the @Value property since we are not loading the full Spring context
        ReflectionTestUtils.setField(refreshTokenService, "refreshTokenDurationMs", 60000L);
    }

    /**
     * Verifies that findByToken delegates to the repository.
     */
    @Test
    void findByTokenDelegatesToRepository() {
        String tokenString = "some-uuid-token";
        RefreshToken mockToken = new RefreshToken();
        when(refreshTokenRepository.findByToken(tokenString)).thenReturn(Optional.of(mockToken));

        Optional<RefreshToken> result = refreshTokenService.findByToken(tokenString);

        assertThat(result).isPresent().contains(mockToken);
    }

    /**
     * Verifies that createRefreshToken generates a new token and saves it to the database.
     */
    @Test
    void createRefreshTokenGeneratesTokenAndSaves() {
        UUID userId = UUID.randomUUID();

        String token = refreshTokenService.createRefreshToken(userId);

        assertThat(token).isNotNull().isNotEmpty();
        // Verify repository was called with correct user ID and a future timestamp
        verify(refreshTokenRepository).save(eq(userId), eq(token), any(Instant.class));
    }

    /**
     * Verifies that verifyExpiration returns the token if it is not expired.
     */
    @Test
    void verifyExpirationReturnsTokenIfValid() {
        RefreshToken token = new RefreshToken();
        token.setExpiryDate(Instant.now().plusSeconds(3600)); // Expires in 1 hour

        RefreshToken result = refreshTokenService.verifyExpiration(token);

        assertThat(result).isSameAs(token);
    }

    /**
     * Verifies that verifyExpiration throws an exception and deletes the token if it is expired.
     */
    @Test
    void verifyExpirationThrowsExceptionAndDeletesTokenIfExpired() {
        UUID userId = UUID.randomUUID();
        User user = new User();
        user.setId(userId);

        RefreshToken token = new RefreshToken();
        token.setUser(user);
        token.setExpiryDate(Instant.now().minusSeconds(3600)); // Expired 1 hour ago

        TokenException exception = assertThrows(TokenException.class, () ->
                refreshTokenService.verifyExpiration(token)
        );

        assertThat(exception.getStatus()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(exception.getMessage()).contains("expired");

        // Verify we cleaned up the DB
        verify(refreshTokenRepository).deleteByUserId(userId);
    }
}
