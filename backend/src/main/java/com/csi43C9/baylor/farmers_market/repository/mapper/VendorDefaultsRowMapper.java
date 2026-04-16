package com.csi43C9.baylor.farmers_market.repository.mapper;

import com.csi43C9.baylor.farmers_market.entity.VendorDefaults;
import com.csi43C9.baylor.farmers_market.util.UuidUtils;
import org.springframework.jdbc.core.RowMapper;
import java.sql.ResultSet;
import java.sql.SQLException;

/**
 * RowMapper implementation for mapping database rows to VendorDefaults entities.
 */
public class VendorDefaultsRowMapper implements RowMapper<VendorDefaults> {
    @Override
    public VendorDefaults mapRow(ResultSet rs, int rowNum) throws SQLException {
        VendorDefaults defaults = new VendorDefaults();
        defaults.setId(UuidUtils.fromBytes(rs.getBytes("id")));
        defaults.setVendorId(UuidUtils.fromBytes(rs.getBytes("vendor_id")));
        defaults.setPctHandmade(rs.getBigDecimal("pct_handmade"));
        defaults.setPctAgricultural(rs.getBigDecimal("pct_agricultural"));
        defaults.setPctPreparedFood(rs.getBigDecimal("pct_prepared_food"));
        defaults.setPctCottageGoods(rs.getBigDecimal("pct_cottage_goods"));
        defaults.setPctManufactured(rs.getBigDecimal("pct_manufactured"));
        defaults.setAvgSale(rs.getObject("avg_sale", Double.class));
        return defaults;
    }
}
