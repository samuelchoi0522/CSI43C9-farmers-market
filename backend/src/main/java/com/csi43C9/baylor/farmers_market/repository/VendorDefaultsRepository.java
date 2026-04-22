package com.csi43C9.baylor.farmers_market.repository;

import com.csi43C9.baylor.farmers_market.entity.VendorDefaults;
import com.csi43C9.baylor.farmers_market.repository.base.AbstractJdbcRepository;
import com.csi43C9.baylor.farmers_market.repository.base.MarketRepository;
import com.csi43C9.baylor.farmers_market.repository.mapper.VendorDefaultsRowMapper;
import com.csi43C9.baylor.farmers_market.util.UuidUtils;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * JDBC implementation of Vendor Defaults management.
 */
@Repository
public class VendorDefaultsRepository extends AbstractJdbcRepository implements MarketRepository<VendorDefaults, UUID> {

    protected VendorDefaultsRepository(JdbcTemplate jdbcTemplate) {
        super(jdbcTemplate);
    }

    @Override
    public VendorDefaults save(VendorDefaults defaults) {
        if (defaults.getId() == null) {
            defaults.setId(UUID.randomUUID());
            return insert(defaults);
        } else {
            int result = update(defaults);
            if (result == 0) {
                throw new IllegalStateException("Failed to update vendor defaults record.");
            }
            return defaults;
        }
    }

    private VendorDefaults insert(VendorDefaults defaults) {
        String sql = """
                insert into vendor_defaults (
                    id, vendor_id, pct_handmade, pct_agricultural,
                    pct_prepared_food, pct_cottage_goods, pct_manufactured,
                    avg_sale
                )
                values (?, ?, ?, ?, ?, ?, ?, ?)
                """;

        jdbcTemplate.update(sql,
                UuidUtils.toBytes(defaults.getId()),
                UuidUtils.toBytes(defaults.getVendorId()),
                defaults.getPctHandmade(),
                defaults.getPctAgricultural(),
                defaults.getPctPreparedFood(),
                defaults.getPctCottageGoods(),
                defaults.getPctManufactured(),
                defaults.getAvgSaleAmount());

        return defaults;
    }

    public int update(VendorDefaults defaults) {
        String sql = """
                update vendor_defaults
                set vendor_id = ?, pct_handmade = ?, pct_agricultural = ?,
                    pct_prepared_food = ?, pct_cottage_goods = ?, pct_manufactured = ?,
                    avg_sale = ?
                where id = ?
                """;

        return jdbcTemplate.update(sql,
                UuidUtils.toBytes(defaults.getVendorId()),
                defaults.getPctHandmade(),
                defaults.getPctAgricultural(),
                defaults.getPctPreparedFood(),
                defaults.getPctCottageGoods(),
                defaults.getPctManufactured(),
                defaults.getAvgSaleAmount(),
                UuidUtils.toBytes(defaults.getId()));
    }

    @Override
    public Optional<VendorDefaults> findById(UUID uuid) {
        String sql = "select * from vendor_defaults where id = ?";
        try {
            VendorDefaults defaults = jdbcTemplate.queryForObject(sql, new VendorDefaultsRowMapper(), UuidUtils.toBytes(uuid));
            return Optional.ofNullable(defaults);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    /**
     * Retrieves vendor defaults by vendor UUID.
     * @param vendorId The UUID of the vendor.
     */
    public Optional<VendorDefaults> findByVendorId(UUID vendorId) {
        String sql = "select * from vendor_defaults where vendor_id = ?";
        try {
            VendorDefaults defaults = jdbcTemplate.queryForObject(sql, new VendorDefaultsRowMapper(), UuidUtils.toBytes(vendorId));
            return Optional.ofNullable(defaults);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    @Override
    public List<VendorDefaults> findAll() {
        String sql = "select * from vendor_defaults";
        return jdbcTemplate.query(sql, new VendorDefaultsRowMapper());
    }

    @Override
    public List<VendorDefaults> findAllPaged(int page, int size) {
        int offset = page * size;
        String sql = """
                select * from vendor_defaults
                order by id
                offset ? rows fetch next ? rows only
                """;
        return jdbcTemplate.query(sql, new VendorDefaultsRowMapper(), offset, size);
    }

    @Override
    public Long count() {
        String sql = "select count(*) from vendor_defaults";
        Long count = jdbcTemplate.queryForObject(sql, Long.class);
        return count != null ? count : 0L;
    }

    @Override
    public void deleteById(UUID uuid) {
        String sql = "delete from vendor_defaults where id = ?";
        jdbcTemplate.update(sql, UuidUtils.toBytes(uuid));
    }
}
