package com.csi43C9.baylor.farmers_market.repository.mapper;

import com.csi43C9.baylor.farmers_market.entity.VendorTransaction;
import com.csi43C9.baylor.farmers_market.util.UuidUtils;
import org.springframework.jdbc.core.RowMapper;
import tools.jackson.core.JacksonException;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;

/**
 * RowMapper implementation for mapping database rows to VendorTransaction entities.
 */
public class VendorTransactionRowMapper implements RowMapper<VendorTransaction> {

    private final ObjectMapper objectMapper;

    /**
     * Constructs a new VendorTransactionRowMapper.
     *
     * @param objectMapper the Jackson mapper for JSON processing
     */
    public VendorTransactionRowMapper(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

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
        transaction.setPctHandmade(rs.getObject("pct_handmade", Double.class));
        transaction.setPctAgricultural(rs.getObject("pct_agricultural", Double.class));
        transaction.setPctPreparedFood(rs.getObject("pct_prepared_food", Double.class));
        transaction.setPctCottageGoods(rs.getObject("pct_cottage_goods", Double.class));
        transaction.setPctManufactured(rs.getObject("pct_manufactured", Double.class));

        String customDataJson = rs.getString("custom_data");
        if (customDataJson != null && !customDataJson.isBlank()) {
            try {
                transaction.setCustomData(objectMapper.readValue(customDataJson, new TypeReference<>() {
                }));
            } catch (JacksonException e) {
                throw new SQLException("Failed to parse custom_data JSON from database", e);
            }
        }

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
