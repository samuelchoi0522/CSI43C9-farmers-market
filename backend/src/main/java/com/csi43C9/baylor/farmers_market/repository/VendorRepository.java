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
            if (result == 0) {
                throw new IllegalStateException("Failed to update vendor record.");
            }
            return vendor;
        }
    }

    /**
     * Inserts a new vendor record into the database.
     * @param vendor the vendor to insert
     * @return the inserted vendor
     */
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
                vendor.getIsActive()
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
                vendor.getIsActive(),
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
            Vendor vendor = jdbcTemplate.queryForObject(sql, new VendorRowMapper(), UuidUtils.toBytes(uuid));
            return Optional.ofNullable(vendor);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    /**
     * Retrieves vendors from the database.
     * @param includeInactive if true, includes inactive vendors
     */
    public List<Vendor> findAll(boolean includeInactive) {
        String sql = "select * from vendors";
        if (!includeInactive) {
            sql += " where is_active = true";
        }
        return jdbcTemplate.query(sql, new VendorRowMapper());
    }

    @Override
    public List<Vendor> findAll() {
        return findAll(false);
    }

    /**
     * Retrieves a page of vendors from the database.
     * @param page 0-based page number
     * @param size page size
     * @param includeInactive if true, includes inactive vendors
     * @return a List of vendors
     */
    public List<Vendor> findAllPaged(int page, int size, boolean includeInactive) {
        int offset = page * size;
        String sql = "select * from vendors";
        if (!includeInactive) {
            sql += " where is_active = true";
        }
        sql += " order by vendor offset ? rows fetch next ? rows only";
        return jdbcTemplate.query(sql, new VendorRowMapper(), offset, size);
    }

    @Override
    public List<Vendor> findAllPaged(int page, int size) {
        return findAllPaged(page, size, false);
    }

    /**
     * Counts the number of vendors in the database.
     * @param includeInactive if true, includes inactive vendors
     * @return the number of vendors
     */
    public Long count(boolean includeInactive) {
        String sql = "select count(*) from vendors";
        if (!includeInactive) {
            sql += " where is_active = true";
        }
        Long count = jdbcTemplate.queryForObject(sql, Long.class);
        return count != null ? count : 0L;
    }

    @Override
    public Long count() {
        return count(false);
    }

    /**
     * Performs a soft delete by setting the is_active flag to false.
     * @param uuid The UUID of the vendor to deactivate.
     */
    @Override
    public void deleteById(UUID uuid) {
        String sql = "update vendors set is_active = false where id = ?";
        jdbcTemplate.update(sql, UuidUtils.toBytes(uuid));
    }

}
