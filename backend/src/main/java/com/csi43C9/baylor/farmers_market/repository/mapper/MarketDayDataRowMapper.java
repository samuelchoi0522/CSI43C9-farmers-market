package com.csi43C9.baylor.farmers_market.repository.mapper;

import com.csi43C9.baylor.farmers_market.entity.MarketDayData;
import org.springframework.jdbc.core.RowMapper;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;

/**
 * RowMapper implementation for mapping database rows to MarketDayData entities.
 */
public class MarketDayDataRowMapper implements RowMapper<MarketDayData> {

    @Override
    public MarketDayData mapRow(ResultSet rs, int rowNum) throws SQLException {
        MarketDayData data = new MarketDayData();
        data.setMarketDate(rs.getDate("market_date").toLocalDate());
        data.setSnapTokenTransactions(rs.getObject("snap_token_transactions", Integer.class));
        data.setSnapTokensPurchased(rs.getObject("snap_tokens_purchased", Double.class));
        data.setSnapTokensRedeemed(rs.getObject("snap_tokens_redeemed", Double.class));
        data.setDufbTokenTransactions(rs.getObject("dufb_token_transactions", Integer.class));
        data.setDufbTokensDistributed(rs.getObject("dufb_tokens_distributed", Double.class));
        data.setDufbTokensRedeemed(rs.getObject("dufb_tokens_redeemed", Double.class));
        data.setWdfmTokenTransactions(rs.getObject("wdfm_token_transactions", Integer.class));
        data.setWdfmTokensPurchased(rs.getObject("wdfm_tokens_purchased", Double.class));
        data.setGiftCardsRedeemed(rs.getObject("gift_cards_redeemed", Double.class));
        data.setWdfmTokensForMarketMeals(rs.getObject("wdfm_tokens_for_market_meals", Double.class));
        data.setWdfmTokensRedeemed(rs.getObject("wdfm_tokens_redeemed", Double.class));

        Timestamp createdAt = rs.getTimestamp("created_at");
        if (createdAt != null) {
            data.setCreatedAt(createdAt.toLocalDateTime());
        }

        Timestamp updatedAt = rs.getTimestamp("updated_at");
        if (updatedAt != null) {
            data.setUpdatedAt(updatedAt.toLocalDateTime());
        }

        return data;
    }
}
