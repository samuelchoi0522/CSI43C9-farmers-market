package com.csi43C9.baylor.farmers_market.repository.mapper;

import com.csi43C9.baylor.farmers_market.entity.VendorTransaction;
import com.csi43C9.baylor.farmers_market.util.UuidUtils;
import org.springframework.jdbc.core.RowMapper;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;

/**
 * RowMapper implementation for mapping database rows to VendorTransaction entities.
 */
public class VendorTransactionRowMapper implements RowMapper<VendorTransaction> {
    @Override
    public VendorTransaction mapRow(ResultSet rs, int rowNum) throws SQLException {
        VendorTransaction transaction = new VendorTransaction();
        transaction.setId(UuidUtils.fromBytes(rs.getBytes("id")));
        transaction.setVendorId(UuidUtils.fromBytes(rs.getBytes("vendor_id")));
        transaction.setVendorName(rs.getString("vendor_name"));
        transaction.setMarketDate(rs.getDate("market_date").toLocalDate());
        transaction.setPresent(rs.getBoolean("present"));
        transaction.setSnap(rs.getObject("snap", Double.class));
        transaction.setDufb(rs.getObject("dufb", Double.class));
        transaction.setWdfmTokens(rs.getObject("wdfm_tokens", Double.class));
        transaction.setVoucher(rs.getObject("voucher", Double.class));
        transaction.setReimbursementDue(rs.getObject("reimbursement_due", Double.class));
        transaction.setReportedSales(rs.getObject("reported_sales", Double.class));
        transaction.setEstProduceSales(rs.getObject("est_produce_sales", Double.class));
        transaction.setEstNumTransactions(rs.getObject("est_num_transactions", Long.class));

        Timestamp createdAt = rs.getTimestamp("created_at");
        if (createdAt != null) {
            transaction.setCreatedAt(createdAt.toLocalDateTime());
        }

        Timestamp updatedAt = rs.getTimestamp("updated_at");
        if (updatedAt != null) {
            transaction.setUpdatedAt(updatedAt.toLocalDateTime());
        }

        return transaction;
    }
}
