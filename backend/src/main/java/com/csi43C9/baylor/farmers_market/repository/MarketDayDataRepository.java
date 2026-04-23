package com.csi43C9.baylor.farmers_market.repository;

import com.csi43C9.baylor.farmers_market.entity.MarketDayData;
import com.csi43C9.baylor.farmers_market.repository.base.AbstractJdbcRepository;
import com.csi43C9.baylor.farmers_market.repository.mapper.MarketDayDataRowMapper;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

/**
 * JDBC implementation of MarketDayData management.
 */
@Repository
public class MarketDayDataRepository extends AbstractJdbcRepository {

    protected MarketDayDataRepository(JdbcTemplate jdbcTemplate) {
        super(jdbcTemplate);
    }

    /**
     * Persists market day data to the database.
     * Uses upsert logic (insert or update).
     */
    public MarketDayData save(MarketDayData data) {
        String sql = """
                merge into market_day_data (
                    market_date, snap_token_transactions, snap_tokens_purchased, snap_tokens_redeemed,
                    dufb_token_transactions, dufb_tokens_distributed, dufb_tokens_redeemed,
                    wdfm_token_transactions, wdfm_tokens_purchased, gift_cards_redeemed,
                    wdfm_tokens_for_market_meals, wdfm_tokens_redeemed
                ) key(market_date)
                values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """;

        jdbcTemplate.update(sql,
                data.getMarketDate(),
                data.getSnapTokenTransactions(),
                data.getSnapTokensPurchased(),
                data.getSnapTokensRedeemed(),
                data.getDufbTokenTransactions(),
                data.getDufbTokensDistributed(),
                data.getDufbTokensRedeemed(),
                data.getWdfmTokenTransactions(),
                data.getWdfmTokensPurchased(),
                data.getGiftCardsRedeemed(),
                data.getWdfmTokensForMarketMeals(),
                data.getWdfmTokensRedeemed()
        );

        return data;
    }

    /**
     * Retrieves market day data for a specific date.
     */
    public Optional<MarketDayData> findByMarketDate(LocalDate date) {
        String sql = "select * from market_day_data where market_date = ?";
        try {
            MarketDayData data = jdbcTemplate.queryForObject(
                    sql,
                    new MarketDayDataRowMapper(),
                    date
            );
            return Optional.ofNullable(data);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }
}
