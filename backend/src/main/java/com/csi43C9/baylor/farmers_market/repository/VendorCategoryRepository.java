package com.csi43C9.baylor.farmers_market.repository;

import com.csi43C9.baylor.farmers_market.dto.vendor.CategoryLabelDto;
import com.csi43C9.baylor.farmers_market.repository.base.AbstractJdbcRepository;
import com.csi43C9.baylor.farmers_market.repository.base.MarketRepository;
import com.csi43C9.baylor.farmers_market.util.UuidUtils;
import org.mariadb.jdbc.Statement;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for managing the many-to-many relationship between Vendors and Category Labels.
 * <p>
 * This class handles the direct database operations for the {@code vendor_category_labels} table,
 * providing methods to link labels to vendors, remove links, and retrieve associated labels.
 * It handles the necessary conversion between Java {@link UUID} objects and the
 * {@code BINARY(16)} format used in the database schema.
 */
@Repository
public class VendorCategoryRepository extends AbstractJdbcRepository implements MarketRepository<CategoryLabelDto, Long> {

    public VendorCategoryRepository(JdbcTemplate jdbc) {
        super(jdbc);
    }

    /**
     * Retrieves all category labels (ID and Name) currently associated with a specific vendor.
     *
     * @param vendorId the unique UUID of the vendor
     * @return a list of CategoryLabelDto representing the labels associated with the vendor;
     * returns an empty list if no labels are found
     */
    public List<CategoryLabelDto> findLabelsByVendor(UUID vendorId) {
        String sql = """
            SELECT cl.id, cl.name, cl.color
            FROM vendor_category_labels vcl
            JOIN category_labels cl ON vcl.label_id = cl.id
            WHERE vcl.vendor_id = ?
        """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> new CategoryLabelDto(
                rs.getLong("id"),
                rs.getString("name"),
                rs.getString("color")
        ), UuidUtils.toBytes(vendorId));
    }

    /**
     * Associates a list of category labels with a specific vendor.
     * <p>
     * This method uses a batch update for performance. It utilizes {@code INSERT IGNORE}
     * to safely handle cases where a label is already associated with the vendor,
     * skipping duplicates without throwing a {@link org.springframework.dao.DataIntegrityViolationException}.
     *
     * @param vendorId the unique UUID of the vendor
     * @param labelIds the list of label IDs to associate with the vendor.
     * If the list is null or empty, the operation returns immediately.
     */
    public void insertVendorLabels(UUID vendorId, List<Long> labelIds) {
        if (labelIds == null || labelIds.isEmpty()) {
            return;
        }

        String sql = "INSERT IGNORE INTO vendor_category_labels (vendor_id, label_id) VALUES (?, ?)";

        // Optimization: Convert UUID to bytes once before the loop
        byte[] vendorBytes = UuidUtils.toBytes(vendorId);

        jdbcTemplate.batchUpdate(sql, labelIds, labelIds.size(), (ps, labelId) -> {
            ps.setBytes(1, vendorBytes); // Parameter index 1: vendor_id
            ps.setLong(2, labelId);      // Parameter index 2: label_id
        });
    }

    /**
     * Removes a specific label association for a vendor.
     *
     * @param vendorId the unique UUID of the vendor
     * @param labelId  the ID of the label to remove
     */
    public void deleteVendorLabel(UUID vendorId, Long labelId) {
        String sql = """
            DELETE FROM vendor_category_labels
            WHERE vendor_id = ?
              AND label_id = ?
        """;

        jdbcTemplate.update(sql, UuidUtils.toBytes(vendorId), labelId);
    }

    /**
     * Helper method to convert a Java {@link UUID} into a 16-byte array.
     * <p>
     * This conversion ensures compatibility with the database's {@code BINARY(16)} column type
     * and matches the standard Big-Endian ordering used by SQL's {@code uuid_to_bin()} function.
     *
     * @param uuid the UUID to convert
     * @return a 16-byte array representing the UUID, or null if the input is null
     */
    /**
     * Inserts a new label into the category_labels table.
     * * @param name The name of the category (e.g., "Organic")
     * * @param color The hex color for the label (e.g., "#10b981")
     * @return A DTO containing the newly generated ID, name, and color
     */
    public CategoryLabelDto createLabel(String name, String color) {
        String sql = "INSERT INTO category_labels (name, color) VALUES (?, ?)";
        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, name);
            ps.setString(2, color);
            return ps;
        }, keyHolder);

        long generatedId = Objects.requireNonNull(keyHolder.getKey()).longValue();
        return new CategoryLabelDto(generatedId, name, color);
    }

    /**
     * Retrieves all labels available in the database.
     */
    public List<CategoryLabelDto> findAllLabels() {
        String sql = "SELECT id, name, color FROM category_labels ORDER BY name ASC";
        return jdbcTemplate.query(sql, (rs, rowNum) -> new CategoryLabelDto(
                rs.getLong("id"),
                rs.getString("name"),
                rs.getString("color")
        ));
    }

    /**
     * Deletes a category label from the global label table and removes its vendor mappings first.
     */
    public void deleteCategoryLabel(Long labelId) {
        String deleteVendorMappingsSql = "DELETE FROM vendor_category_labels WHERE label_id = ?";
        String deleteLabelSql = "DELETE FROM category_labels WHERE id = ?";

        jdbcTemplate.update(deleteVendorMappingsSql, labelId);
        jdbcTemplate.update(deleteLabelSql, labelId);
    }

    /**
     * Updates a category label's name.
     */
    public CategoryLabelDto updateCategoryLabel(Long labelId, String name, String color) {
        String sql = "UPDATE category_labels SET name = ?, color = ? WHERE id = ?";
        jdbcTemplate.update(sql, name, color, labelId);
        return new CategoryLabelDto(labelId, name, color);
    }

    @Override
    public CategoryLabelDto save(CategoryLabelDto entity) {
        if (entity.getId() == null) {
            return createLabel(entity.getName(), entity.getColor());
        }
        return updateCategoryLabel(entity.getId(), entity.getName(), entity.getColor());
    }

    @Override
    public Optional<CategoryLabelDto> findById(Long id) {
        String sql = "SELECT id, name, color FROM category_labels WHERE id = ?";
        try {
            CategoryLabelDto label = jdbcTemplate.queryForObject(sql, (rs, rowNum) -> new CategoryLabelDto(
                    rs.getLong("id"),
                    rs.getString("name"),
                    rs.getString("color")
            ), id);
            return Optional.ofNullable(label);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    @Override
    public List<CategoryLabelDto> findAll() {
        return findAllLabels();
    }

    @Override
    public List<CategoryLabelDto> findAllPaged(int pageNumber, int pageSize) {
        int offset = pageNumber * pageSize;
        String sql = "SELECT id, name, color FROM category_labels ORDER BY name ASC LIMIT ? OFFSET ?";
        return jdbcTemplate.query(sql, (rs, rowNum) -> new CategoryLabelDto(
                rs.getLong("id"),
                rs.getString("name"),
                rs.getString("color")
        ), pageSize, offset);
    }

    @Override
    public Long count() {
        String sql = "SELECT COUNT(*) FROM category_labels";
        return jdbcTemplate.queryForObject(sql, Long.class);
    }

    @Override
    public void deleteById(Long id) {
        deleteCategoryLabel(id);
    }
}
