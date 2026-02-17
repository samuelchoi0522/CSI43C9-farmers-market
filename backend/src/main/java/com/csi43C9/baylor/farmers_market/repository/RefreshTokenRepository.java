package com.csi43C9.baylor.farmers_market.repository;

import com.csi43C9.baylor.farmers_market.entity.security.RefreshToken;
import com.csi43C9.baylor.farmers_market.repository.base.AbstractJdbcRepository;
import com.csi43C9.baylor.farmers_market.repository.mapper.RefreshTokenRowMapper;
import com.csi43C9.baylor.farmers_market.util.UuidUtils;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for managing refresh tokens.
 * Extends {@link AbstractJdbcRepository} for binary UUID mapping.
 * @see RefreshToken
 *
 * Excluded from MarketRepository interface to avoid exposing the underlying table.
 */
@Repository
public class RefreshTokenRepository extends AbstractJdbcRepository {
    protected RefreshTokenRepository(JdbcTemplate jdbcTemplate) {
        super(jdbcTemplate);
    }

    /**
     * Persists a new refresh token to the database.
     * @param userId the user ID associated with the token
     * @param token the token value
     * @param expiry the token expiry date
     */
    public void save(UUID userId, String token, Instant expiry) {
        // Update existing token if it exists, otherwise insert a new one.
        RefreshToken exisingToken = findByUserId(userId).orElse(null);
        if (exisingToken != null) {
            exisingToken.setToken(token);
            exisingToken.setExpiryDate(expiry);
            update(exisingToken);
            return;
        }

        String sql = """
                insert into refresh_tokens (id, user_id, token, expiry_date)
                values (?, ?, ?, ?)
                """;
        jdbcTemplate.update(sql,
                UuidUtils.toBytes(UUID.randomUUID()),
                UuidUtils.toBytes(userId),
                token,
                Timestamp.from(expiry));
    }

    /**
     * Updates an existing refresh token in the database.
     * @param token the token to update
     */
    private void update(RefreshToken token) {
        String sql = "update refresh_tokens set token = ?, expiry_date = ? where id = ?";
        jdbcTemplate.update(sql, token.getToken(), Timestamp.from(token.getExpiryDate()), UuidUtils.toBytes(token.getId()));
    }

    /**
     * Finds a refresh token by its token value.
     * @param token the token value
     * @return the refresh token, if found
     */
    public Optional<RefreshToken> findByToken(String token) {
        String sql = "select * from refresh_tokens where token = ?";
        return jdbcTemplate.query(sql, new RefreshTokenRowMapper(), token)
                .stream().findFirst();
    }

    /**
     * Finds a refresh token by its user ID.
     * @param userId the user ID
     * @return the refresh token, if found
     */
    public Optional<RefreshToken> findByUserId(UUID userId) {
        String sql = "select * from refresh_tokens where user_id = ?";
        return jdbcTemplate.query(sql, new RefreshTokenRowMapper(), UuidUtils.toBytesObject(userId))
                .stream().findFirst();
    }

    /**
     * Deletes all refresh tokens associated with a user.
     * @param userId the user ID
     */
    public void deleteByUserId(UUID userId) {
        String sql = "delete from refresh_tokens where user_id = ?";
        jdbcTemplate.update(sql, UuidUtils.toBytesObject(userId));
    }
}
