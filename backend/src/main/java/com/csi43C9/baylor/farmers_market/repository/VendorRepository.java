package com.csi43C9.baylor.farmers_market.repository;

import com.csi43C9.baylor.farmers_market.entity.Vendor;
import com.csi43C9.baylor.farmers_market.repository.base.BaseUuidRepository;
import com.csi43C9.baylor.farmers_market.repository.base.MarketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.nio.ByteBuffer;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * JDBC implementation of Vendor management.
 * Extends {@link BaseUuidRepository} for binary UUID mapping.
 */
@Repository
public class VendorRepository extends BaseUuidRepository implements MarketRepository<Vendor, UUID> {

    protected VendorRepository(JdbcTemplate jdbcTemplate) {
        super(jdbcTemplate);
    }

    /**
     * Persists a new vendor to the database.
     * Generates a random {@link UUID} and converts it to a 16-byte array for
     * storage in a BINARY(16) column.
     *
     * @param vendor the vendor entity to be saved.
     * @return the saved vendor entity with its generated UUID.
     */
    public Vendor save(Vendor vendor) {
        if (vendor.getId() == null) {
            vendor.setId(UUID.randomUUID());
        }

        String sql = """
                INSERT INTO vendors (id, vendor, point_person, email, location, miles, products,
                is_active, is_farmer, is_produce, woman_owned, bipoc_owned, veteran_owned)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """;

        jdbcTemplate.update(sql,
                uuidToBytes(vendor.getId()),
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

    @Override
    public Optional<Vendor> findById(UUID uuid) {
        return Optional.empty();
    }

    @Override
    public List<Vendor> findAll() {
        return List.of();
    }

    @Override
    public void deleteById(UUID uuid) {

    }

}
