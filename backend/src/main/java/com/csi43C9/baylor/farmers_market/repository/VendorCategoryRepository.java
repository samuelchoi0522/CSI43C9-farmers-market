package com.csi43C9.baylor.farmers_market.repository;

import com.csi43C9.baylor.farmers_market.dto.vendor.CategoryLabelDto;
import org.mariadb.jdbc.Statement;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.nio.ByteBuffer;
import java.sql.PreparedStatement;
import java.util.List;
import java.util.Objects;
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
public class VendorCategoryRepository {

    private final JdbcTemplate jdbc;

    public VendorCategoryRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
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
            SELECT cl.id, cl.name
            FROM vendor_category_labels vcl
            JOIN category_labels cl ON vcl.label_id = cl.id
            WHERE vcl.vendor_id = ?
        """;

        return jdbc.query(sql, (rs, rowNum) -> new CategoryLabelDto(
                rs.getLong("id"),
                rs.getString("name")
        ), uuidToBytes(vendorId));
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
        byte[] vendorBytes = uuidToBytes(vendorId);

        jdbc.batchUpdate(sql, labelIds, labelIds.size(), (ps, labelId) -> {
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

        jdbc.update(sql, uuidToBytes(vendorId), labelId);
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
    public byte[] uuidToBytes(UUID uuid) {
        if (uuid == null) {
            return null;
        }
        ByteBuffer bb = ByteBuffer.wrap(new byte[16]);
        bb.putLong(uuid.getMostSignificantBits());
        bb.putLong(uuid.getLeastSignificantBits());
        return bb.array();
    }

    /**
     * Inserts a new label into the category_labels table.
     * * @param name The name of the category (e.g., "Organic")
     * @return A DTO containing the newly generated ID and the name
     */
    public CategoryLabelDto createLabel(String name) {
        String sql = "INSERT INTO category_labels (name) VALUES (?)";
        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbc.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, name);
            return ps;
        }, keyHolder);

        long generatedId = Objects.requireNonNull(keyHolder.getKey()).longValue();
        return new CategoryLabelDto(generatedId, name);
    }

    /**
     * Retrieves all labels available in the database.
     */
    public List<CategoryLabelDto> findAllLabels() {
        String sql = "SELECT id, name FROM category_labels ORDER BY name ASC";
        return jdbc.query(sql, (rs, rowNum) -> new CategoryLabelDto(
                rs.getLong("id"),
                rs.getString("name")
        ));
    }

    /**
     * Deletes a category label from the global label table and removes its vendor mappings first.
     */
    public void deleteCategoryLabel(Long labelId) {
        String deleteVendorMappingsSql = "DELETE FROM vendor_category_labels WHERE label_id = ?";
        String deleteLabelSql = "DELETE FROM category_labels WHERE id = ?";

        jdbc.update(deleteVendorMappingsSql, labelId);
        jdbc.update(deleteLabelSql, labelId);
    }
}
