package com.csi43C9.baylor.farmers_market.repository.base;

import org.springframework.jdbc.core.JdbcTemplate;
import java.nio.ByteBuffer;
import java.util.UUID;

/**
 * Abstract base repository providing common utility methods for
 * entities using UUIDs as primary keys in MariaDB/MySQL.
 */
public abstract class BaseUuidRepository {

    protected final JdbcTemplate jdbcTemplate;

    protected BaseUuidRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Converts a Java UUID to a 16-byte array for BINARY(16) columns.
     * * @param uuid The UUID to convert.
     * @return A byte array representing the UUID, or null if input is null.
     */
    protected byte[] uuidToBytes(UUID uuid) {
        if (uuid == null) {
            return null;
        }
        ByteBuffer bb = ByteBuffer.wrap(new byte[16]);
        bb.putLong(uuid.getMostSignificantBits());
        bb.putLong(uuid.getLeastSignificantBits());
        return bb.array();
    }

    /**
     * Converts a 16-byte array from BINARY(16) back to a Java UUID.
     * * @param bytes The byte array from the database.
     * @return The corresponding UUID, or null if input is invalid.
     */
    protected UUID bytesToUuid(byte[] bytes) {
        if (bytes == null || bytes.length != 16) {
            return null;
        }
        ByteBuffer byteBuffer = ByteBuffer.wrap(bytes);
        long high = byteBuffer.getLong();
        long low = byteBuffer.getLong();
        return new UUID(high, low);
    }
}