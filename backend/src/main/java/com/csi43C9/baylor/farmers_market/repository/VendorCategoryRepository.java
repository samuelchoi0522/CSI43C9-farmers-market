package com.csi43C9.baylor.farmers_market.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.nio.ByteBuffer;
import java.util.List;
import java.util.UUID;

@Repository
public class VendorCategoryRepository {

    private final JdbcTemplate jdbc;

    public VendorCategoryRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    // Fetch all label IDs associated with a given vendor
    public List<Long> findLabelIdsByVendor(UUID vendorId) {
        String sql = """
            SELECT label_id
            FROM vendor_category_labels
            WHERE vendor_id = ?
        """;

        return jdbc.queryForList(sql, Long.class, uuidToBytes(vendorId));
    }

    // Insert multiple label associations for a vendor in batch
    // Ignore labels resulting in error & duplicate labels
    public void insertVendorLabels(UUID vendorId, List<Long> labelIds) {
        String sql = """
        INSERT IGNORE INTO vendor_category_labels (vendor_id, label_id) VALUES (?, ?)
    """;

        jdbc.batchUpdate(sql, new org.springframework.jdbc.core.BatchPreparedStatementSetter() {
            @Override
            public void setValues(java.sql.PreparedStatement ps, int i) throws java.sql.SQLException {
                ps.setBytes(1, uuidToBytes(vendorId));
                ps.setLong(2, labelIds.get(i));
            }

            @Override
            public int getBatchSize() {
                return labelIds.size();
            }
        });
    }

    // Delete a specific label association for a vendor
    public void deleteVendorLabel(UUID vendorId, long labelId) {
        String sql = """
            DELETE FROM vendor_category_labels
            WHERE vendor_id = ?
              AND label_id = ?
        """;

        jdbc.update(sql, uuidToBytes(vendorId), labelId);
    }

    // Convert UUID to byte array for database storage according to schema
    private byte[] uuidToBytes(UUID uuid) {
        ByteBuffer bb = ByteBuffer.allocate(16);
        bb.putLong(uuid.getMostSignificantBits());
        bb.putLong(uuid.getLeastSignificantBits());
        return bb.array();
    }
}
