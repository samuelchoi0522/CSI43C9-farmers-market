package com.csi43C9.baylor.farmers_market.repository;

import com.csi43C9.baylor.farmers_market.dto.custom_column.CustomColumnMetadata;
import com.csi43C9.baylor.farmers_market.repository.base.AbstractJdbcRepository;
import com.csi43C9.baylor.farmers_market.repository.base.MarketRepository;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

/**
 * JDBC repository for managing CustomColumnMetadata operations.
 */
@Repository
public class CustomColumnRepository extends AbstractJdbcRepository implements MarketRepository<CustomColumnMetadata, Long> {

    /**
     * Constructs a new CustomColumnRepository.
     *
     * @param jdbcTemplate the Spring JdbcTemplate
     */
    public CustomColumnRepository(JdbcTemplate jdbcTemplate) {
        super(jdbcTemplate);
    }

    /**
     * Persists a new record or updates an existing one.
     *
     * @param entity The custom column metadata to save.
     * @return The saved or updated custom column metadata.
     */
    @Override
    public CustomColumnMetadata save(CustomColumnMetadata entity) {
        if (Objects.isNull(entity.id())) {
            String sql = """
                    insert into custom_columns (name, type, is_required)
                    values (?, ?, ?)
                    """;

            KeyHolder keyHolder = new GeneratedKeyHolder();
            jdbcTemplate.update(connection -> {
                PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
                ps.setString(1, entity.name());
                ps.setString(2, entity.type());
                ps.setBoolean(3, entity.isRequired());
                return ps;
            }, keyHolder);

            Number key = keyHolder.getKey();
            Long newId = Objects.nonNull(key) ? key.longValue() : null;

            return new CustomColumnMetadata(newId, entity.name(), entity.type(), entity.isRequired());
        } else {
            String sql = """
                    update custom_columns
                    set name = ?, type = ?, is_required = ?
                    where id = ?
                    """;
            jdbcTemplate.update(sql, entity.name(), entity.type(), entity.isRequired(), entity.id());
            return entity;
        }
    }

    /**
     * Finds a record by its unique ID.
     *
     * @param id The ID of the column.
     * @return An Optional containing the column if found.
     */
    @Override
    public Optional<CustomColumnMetadata> findById(Long id) {
        String sql = """
                select id, name, type, is_required
                from custom_columns
                where id = ?
                """;
        try {
            CustomColumnMetadata column = jdbcTemplate.queryForObject(sql, new ColumnMetadataMapper(), id);
            return Optional.ofNullable(column);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    /**
     * Retrieves all records of type CustomColumnMetadata.
     *
     * @return A list of all columns.
     */
    @Override
    public List<CustomColumnMetadata> findAll() {
        String sql = """
                select id, name, type, is_required
                from custom_columns
                """;
        return jdbcTemplate.query(sql, new ColumnMetadataMapper());
    }

    /**
     * Retrieves a paged list of records.
     *
     * @param pageNumber The page number to retrieve (0-indexed).
     * @param pageSize   The number of records per page.
     * @return A list of paged records.
     */
    @Override
    public List<CustomColumnMetadata> findAllPaged(int pageNumber, int pageSize) {
        int offset = pageNumber * pageSize;
        String sql = """
                select id, name, type, is_required
                from custom_columns
                order by id
                offset ? rows fetch next ? rows only
                """;
        return jdbcTemplate.query(sql, new ColumnMetadataMapper(), offset, pageSize);
    }

    /**
     * Returns the total number of records in the database.
     *
     * @return the total number of records
     */
    @Override
    public Long count() {
        String sql = """
                select count(*)
                from custom_columns
                """;
        return jdbcTemplate.queryForObject(sql, Long.class);
    }

    /**
     * Performs a hard delete of the custom column.
     *
     * @param id The ID of the record to delete.
     */
    @Override
    public void deleteById(Long id) {
        String sql = """
                delete from custom_columns
                where id = ?
                """;
        jdbcTemplate.update(sql, id);
    }

    /**
     * Retrieves all active custom column configurations from the database.
     *
     * @return a list of active custom column metadata records
     */
    public List<CustomColumnMetadata> findAllActiveColumns() {
        String sql = """
                select id, name, type, is_required
                from custom_columns
                where deactivated_at is null
                """;
        return jdbcTemplate.query(sql, new ColumnMetadataMapper());
    }

    /**
     * Deactivates a custom column by setting its deactivated_at timestamp.
     *
     * @param id The ID of the column to deactivate.
     */
    public void deactivate(Long id) {
        String sql = """
                update custom_columns
                set deactivated_at = current_timestamp
                where id = ?
                """;
        jdbcTemplate.update(sql, id);
    }

    /**
     * Reactivates a custom column by clearing its deactivated_at timestamp.
     *
     * @param id The ID of the column to reactivate.
     */
    public void reactivate(Long id) {
        String sql = """
                UPDATE custom_columns
                SET deactivated_at = NULL
                WHERE id = ?
                """;
        jdbcTemplate.update(sql, id);
    }

    /**
     * RowMapper for parsing custom column metadata.
     */
    private static class ColumnMetadataMapper implements RowMapper<CustomColumnMetadata> {
        @Override
        public CustomColumnMetadata mapRow(ResultSet rs, int rowNum) throws SQLException {
            return new CustomColumnMetadata(
                    rs.getLong("id"),
                    rs.getString("name"),
                    rs.getString("type"),
                    rs.getBoolean("is_required")
            );
        }
    }
}
