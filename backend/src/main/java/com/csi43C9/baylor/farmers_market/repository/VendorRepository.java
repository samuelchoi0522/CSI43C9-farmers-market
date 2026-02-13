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
     */
    @Override
    public Vendor save(Vendor vendor) {
        if (vendor.getId() == null) {
            vendor.setId(UUID.randomUUID());
            return insert(vendor);
        } else {
            // Return the vendor if successful, otherwise throw an exception.
            int result = update(vendor);
            if (result == 0) throw new IllegalStateException("Failed to update vendor record.");
            return vendor;
        }
    }

    private Vendor insert(Vendor vendor) {
        String sql = """
                insert into vendors (
                    id, vendor, point_person, email, location, miles, products,
                    is_active, is_farmer, is_produce, woman_owned, bipoc_owned, veteran_owned
                )
                values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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

    /**
     * Updates an existing vendor record.
     * @return the number of rows affected (should be 1 if successful).
     */
    public int update(Vendor vendor) {
        String sql = """
                update vendors
                set vendor = ?, point_person = ?, email = ?, location = ?,
                    miles = ?, products = ?, is_active = ?, is_farmer = ?,
                    is_produce = ?, woman_owned = ?, bipoc_owned = ?,
                    veteran_owned = ?
                where id = ?
                """;

        return jdbcTemplate.update(sql,
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
                vendor.isVeteranOwned(),
                UuidUtils.toBytes(vendor.getId())
        );
    }


    /**
     * Retrieves a vendor by its UUID from the database.
     * @param uuid The UUID of the vendor to retrieve.
     */
    @Override
    public Optional<Vendor> findById(UUID uuid) {
        String sql = "select * from vendors where id = ?";
        try {
            Vendor vendor = jdbcTemplate.queryForObject(sql, new VendorRowMapper(), UuidUtils.toBytesObject(uuid));
            return Optional.ofNullable(vendor);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    /**
     * Retrieves all active vendors from the database.
     */
    @Override
    public List<Vendor> findAll() {
        String sql = "select * from vendors where is_active = true";
        return jdbcTemplate.query(sql, new VendorRowMapper());
    }

    /**
     * Retrieves a page of active vendors from the database.
     * @param page 0-based page number
     * @param size page size
     * @return a List of active vendors
     */
    @Override
    public List<Vendor> findAllPaged(int page, int size) {
        int offset = page * size;
        String sql = """
                select * from vendors
                where is_active = true
                order by vendor
                offset ? rows fetch next ? rows only
                """;
        return jdbcTemplate.query(sql, new VendorRowMapper(), offset, size);
    }

    /**
     * Counts the number of active vendors in the database.
     * @return the number of active vendors
     */
    public Long count() {
        String sql = "select count(*) from vendors where is_active = true";
        Long count = jdbcTemplate.queryForObject(sql, Long.class);
        return count != null ? count : 0L;
    }

    /**
     * Performs a soft delete by setting the is_active flag to false.
     * @param uuid The UUID of the vendor to deactivate.
     */
    @Override
    public void deleteById(UUID uuid) {
        String sql = "update vendors set is_active = false where id = ?";
        jdbcTemplate.update(sql, UuidUtils.toBytesObject(uuid));
    }

}
