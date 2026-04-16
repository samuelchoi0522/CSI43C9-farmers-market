package com.csi43C9.baylor.farmers_market.repository.mapper;

import com.csi43C9.baylor.farmers_market.entity.Vendor;
import com.csi43C9.baylor.farmers_market.util.UuidUtils;
import org.springframework.jdbc.core.RowMapper;

import java.sql.ResultSet;
import java.sql.SQLException;

/**
 * RowMapper implementation for mapping database rows to Vendor entities.
 */
public class VendorRowMapper implements RowMapper<Vendor> {
    @Override
    public Vendor mapRow(ResultSet rs, int rowNum) throws SQLException {
        Vendor vendor = new Vendor();
        vendor.setId(UuidUtils.fromBytes(rs.getBytes("id")));
        vendor.setVendorName(rs.getString("vendor"));
        vendor.setPointPerson(rs.getString("point_person"));
        vendor.setEmail(rs.getString("email"));
        vendor.setLocation(rs.getString("location"));
        vendor.setMiles(rs.getObject("miles", Integer.class));
        vendor.setProducts(rs.getString("products"));
        vendor.setAvgSale(rs.getObject("avg_sale", Double.class));
        vendor.setIsActive(rs.getBoolean("is_active"));
        return vendor;
    }

}
