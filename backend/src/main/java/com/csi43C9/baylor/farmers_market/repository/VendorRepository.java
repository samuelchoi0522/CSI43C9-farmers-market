package com.csi43C9.baylor.farmers_market.repository;

import com.csi43C9.baylor.farmers_market.entity.Vendor;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.nio.ByteBuffer;
import java.util.UUID;

/**
 * Repository for managing {@link Vendor} data using JDBC.
 * This implementation generates UUIDs in Java and converts them to byte arrays
 * to ensure compatibility with databases that do not support the UUID_TO_BIN function.
 */
@Repository
@RequiredArgsConstructor
public class VendorRepository {

    private final JdbcTemplate jdbcTemplate;

    /**
     * Persists a new vendor to the database.
     * Generates a random {@link UUID} and converts it to a 16-byte array for
     * storage in a BINARY(16) column.
     *
     * @param vendor the vendor entity to be saved.
     * @return the saved vendor entity with its generated UUID.
     */
    public Vendor save(Vendor vendor) {
        String sql = """
                INSERT INTO vendors (id, vendor, point_person, email, location, miles, products,
                is_active, is_farmer, is_produce, woman_owned, bipoc_owned, veteran_owned)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """;

        if (vendor.getId() == null) {
            vendor.setId(UUID.randomUUID());
        }

        byte[] uuidBytes = convertUUIDToBytes(vendor.getId());

        jdbcTemplate.update(sql,
                uuidBytes,
                vendor.getVendorName(),
                vendor.getPointPerson(),
                vendor.getEmail(),
                vendor.getLocation(),
                vendor.getMiles(),
                vendor.getProducts(),
                vendor.isActive(),
                vendor.isFarmer(),
                vendor.isProduce(),
                vendor.isWomanOwned(),
                vendor.isBipocOwned(),
                vendor.isVeteranOwned()
        );

        return vendor;
    }

    /**
     * Converts a {@link UUID} into a 16-byte array.
     *
     * @param uuid the UUID to convert.
     * @return a byte array of length 16.
     */
    private byte[] convertUUIDToBytes(UUID uuid) {
        ByteBuffer bb = ByteBuffer.wrap(new byte[16]);
        bb.putLong(uuid.getMostSignificantBits());
        bb.putLong(uuid.getLeastSignificantBits());
        return bb.array();
    }
}
