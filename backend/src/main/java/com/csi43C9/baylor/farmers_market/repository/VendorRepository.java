package com.csi43C9.baylor.farmers_market.repository;

import com.csi43C9.baylor.farmers_market.entity.Vendor;
import com.csi43C9.baylor.farmers_market.repository.base.AbstractJdbcRepository;
import com.csi43C9.baylor.farmers_market.repository.base.MarketRepository;
import com.csi43C9.baylor.farmers_market.repository.mapper.VendorRowMapper;
import com.csi43C9.baylor.farmers_market.util.UuidUtils;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * JDBC implementation of Vendor management.
 * Extends {@link AbstractJdbcRepository} for binary UUID mapping.
 */
@Repository
public class VendorRepository extends AbstractJdbcRepository implements MarketRepository<Vendor, UUID> {

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
    @Override
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
                UuidUtils.toBytes(vendor.getId()),
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
        String sql = "SELECT * FROM vendors WHERE id = ?";
        try {
            Vendor vendor = jdbcTemplate.queryForObject(sql, new VendorRowMapper(), UuidUtils.toBytesObject(uuid));
            return Optional.ofNullable(vendor);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    @Override
    public List<Vendor> findAll() {
        String sql = "SELECT * FROM vendors WHERE is_active = TRUE";
        return jdbcTemplate.query(sql, new VendorRowMapper());
    }

    /**
     * Performs a soft delete by setting the is_active flag to false.
     * * @param uuid The UUID of the vendor to deactivate.
     */
    @Override
    public void deleteById(UUID uuid) {
        String sql = "UPDATE vendors SET is_active = FALSE WHERE id = ?";
        jdbcTemplate.update(sql, UuidUtils.toBytesObject(uuid));
    }

}


