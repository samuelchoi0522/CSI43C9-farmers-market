package com.csi43C9.baylor.farmers_market.repository.mapper;

import com.csi43C9.baylor.farmers_market.entity.User;
import com.csi43C9.baylor.farmers_market.entity.security.RefreshToken;
import com.csi43C9.baylor.farmers_market.util.UuidUtils;
import org.springframework.jdbc.core.RowMapper;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;

/**
 * RowMapper implementation for mapping database rows to RefreshToken entities.
 */
public class RefreshTokenRowMapper implements RowMapper<RefreshToken> {
    @Override
    public RefreshToken mapRow(ResultSet rs, int rowNum) throws SQLException {
        // Map each column to a field in the token
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setId(UuidUtils.fromBytes(rs.getBytes("id")));
        refreshToken.setToken(rs.getString("token"));
        refreshToken.setExpiryDate(rs.getObject("expiry_date", Instant.class));

        // Map the user ID to the token's user field'
        User user = new User();
        user.setId(UuidUtils.fromBytes(rs.getBytes("user_id")));
        refreshToken.setUser(user);

        return refreshToken;
    }
}
