package com.csi43C9.baylor.farmers_market.repository;

import com.csi43C9.baylor.farmers_market.dto.custom_column.CustomColumnMetadata;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

/**
 * JDBC repository for retrieving active custom column definitions.
 */
@Repository
public class CustomColumnRepository {

    private final JdbcTemplate jdbcTemplate;

    /**
     * Constructs a new CustomColumnRepository.
     *
     * @param jdbcTemplate the Spring JdbcTemplate
     */
    public CustomColumnRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Retrieves all active custom column configurations from the database.
     *
     * @return a list of custom column metadata records
     */
    public List<CustomColumnMetadata> findAllActiveColumns() {
        String sql = """
                select name, type, is_required
                from custom_columns
                where deactivated_at is null
                """;

        return jdbcTemplate.query(sql, new ColumnMetadataMapper());
    }

    /**
     * RowMapper for parsing custom column metadata.
     */
    private static class ColumnMetadataMapper implements RowMapper<CustomColumnMetadata> {

        @Override
        public CustomColumnMetadata mapRow(ResultSet rs, int rowNum) throws SQLException {
            return new CustomColumnMetadata(
                    rs.getString("name"),
                    rs.getString("type"),
                    rs.getBoolean("is_required")
            );
        }
    }
}