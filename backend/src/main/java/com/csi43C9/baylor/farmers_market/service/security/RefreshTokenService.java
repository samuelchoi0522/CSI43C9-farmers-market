package com.csi43C9.baylor.farmers_market.service.security;

import com.csi43C9.baylor.farmers_market.entity.security.RefreshToken;
import com.csi43C9.baylor.farmers_market.exception.TokenException;
import com.csi43C9.baylor.farmers_market.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    @Value("${farmers.market.jwt.refresh-expiration-ms:1209600000}") // Default 14 days
    private Long refreshTokenDurationMs;

    private final RefreshTokenRepository refreshTokenRepository;

    public Optional<RefreshToken> findByToken(String token) {
        return refreshTokenRepository.findByToken(token);
    }

    /**
     * Creates or updates a refresh token for a user.
     */
    public String createRefreshToken(UUID userId) {
        String token = UUID.randomUUID().toString();
        Instant expiry = Instant.now().plusMillis(refreshTokenDurationMs);

        refreshTokenRepository.save(userId, token, expiry);
        return token;
    }

    /**
     * Verifies if the token is expired. If so, deletes it and throws an error.
     */
    public RefreshToken verifyExpiration(RefreshToken token) {
        if (token.getExpiryDate().isBefore(Instant.now())) {
            refreshTokenRepository.deleteByUserId(token.getUser().getId());
            throw new TokenException("Refresh token has expired. Please make a new login request.", HttpStatus.FORBIDDEN);
        }
        return token;
    }
}