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

    public List<Long> findLabelIdsByVendor(UUID vendorId) {
        String sql = """
            SELECT label_id
            FROM vendor_category_labels
            WHERE vendor_id = ?
        """;

        return jdbc.queryForList(sql, Long.class, uuidToBytes(vendorId));
    }

    public void insertVendorLabels(UUID vendorId, List<Long> labelIds) {
        String sql = """
            INSERT INTO vendor_category_labels (vendor_id, label_id)
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE label_id = label_id
        """;

        jdbc.batchUpdate(
                sql,
                labelIds,
                labelIds.size(),
                (ps, labelId) -> {
                    ps.setBytes(1, uuidToBytes(vendorId));
                    ps.setLong(2, labelId);
                }
        );
    }

    public void deleteVendorLabel(UUID vendorId, long labelId) {
        String sql = """
            DELETE FROM vendor_category_labels
            WHERE vendor_id = ?
              AND label_id = ?
        """;

        jdbc.update(sql, uuidToBytes(vendorId), labelId);
    }

    private byte[] uuidToBytes(UUID uuid) {
        ByteBuffer bb = ByteBuffer.allocate(16);
        bb.putLong(uuid.getMostSignificantBits());
        bb.putLong(uuid.getLeastSignificantBits());
        return bb.array();
    }
}
