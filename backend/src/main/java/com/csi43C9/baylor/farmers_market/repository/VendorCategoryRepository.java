package com.csi43C9.baylor.farmers_market.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.nio.ByteBuffer;
import java.util.List;
import java.util.UUID;

/**
 * Repository for managing the many-to-many relationship between Vendors and Category Labels.
 * <p>
 * This class handles the direct database operations for the {@code vendor_category_labels} table,
 * providing methods to link labels to vendors, remove links, and retrieve associated label IDs.
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
     * Retrieves all label IDs currently associated with a specific vendor.
     *
     * @param vendorId the unique UUID of the vendor
     * @return a list of Long IDs representing the labels associated with the vendor;
     * returns an empty list if no labels are found
     */
    public List<Long> findLabelIdsByVendor(UUID vendorId) {
        String sql = """
            SELECT label_id
            FROM vendor_category_labels
            WHERE vendor_id = ?
        """;

        return jdbc.queryForList(sql, Long.class, uuidToBytes(vendorId));
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
        // Only proceed if there is data to insert
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
    public void deleteVendorLabel(UUID vendorId, long labelId) {
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
}