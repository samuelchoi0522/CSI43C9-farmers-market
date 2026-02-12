package com.csi43C9.baylor.farmers_market.util;

import java.nio.ByteBuffer;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Utility class for converting between Java UUIDs and MariaDB BINARY(16) formats.
 */
public final class UuidUtils {

    private UuidUtils() {
        // Private constructor to prevent instantiation
    }

    /**
     * Converts a UUID to a byte array.
     */
    public static byte[] toBytes(UUID uuid) {
        if (uuid == null) return null;
        ByteBuffer bb = ByteBuffer.wrap(new byte[16]);
        bb.putLong(uuid.getMostSignificantBits());
        bb.putLong(uuid.getLeastSignificantBits());
        return bb.array();
    }

    /**
     * Wraps the byte array in an Object array for use in a prepared statement.
     */
    public static Object[] toBytesObject(UUID uuid) {
        return new Object[]{toBytes(uuid)};
    }

    /**
     * Converts a byte array back to a UUID.
     */
    public static UUID fromBytes(byte[] bytes) {
        if (bytes == null || bytes.length != 16) return null;
        ByteBuffer bb = ByteBuffer.wrap(bytes);
        return new UUID(bb.getLong(), bb.getLong());
    }

}