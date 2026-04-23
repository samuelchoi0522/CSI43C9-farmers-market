package com.csi43C9.baylor.farmers_market.repository;

import com.csi43C9.baylor.farmers_market.dto.market_goal.MarketGoal;
import com.csi43C9.baylor.farmers_market.repository.base.AbstractJdbcRepository;
import com.csi43C9.baylor.farmers_market.repository.base.MarketRepository;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

/**
 * JDBC repository for {@link MarketGoal} rows.
 */
@Repository
public class MarketGoalRepository extends AbstractJdbcRepository implements MarketRepository<MarketGoal, Long> {

    public MarketGoalRepository(JdbcTemplate jdbcTemplate) {
        super(jdbcTemplate);
    }

    @Override
    public MarketGoal save(MarketGoal entity) {
        if (Objects.isNull(entity.id())) {
            String sql = """
                    insert into market_goals (name, start_date, end_date, metric, target_value)
                    values (?, ?, ?, ?, ?)
                    """;
            KeyHolder keyHolder = new GeneratedKeyHolder();
            jdbcTemplate.update(connection -> {
                PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
                ps.setString(1, entity.name());
                ps.setObject(2, entity.startDate());
                ps.setObject(3, entity.endDate());
                ps.setString(4, entity.metric());
                ps.setDouble(5, entity.targetValue());
                return ps;
            }, keyHolder);
            Long newId = null;
            var keys = keyHolder.getKeys();
            if (keys != null) {
                Object idObj = keys.get("ID") != null ? keys.get("ID") : keys.get("id");
                if (idObj != null) {
                    newId = ((Number) idObj).longValue();
                }
            }
            return new MarketGoal(newId, entity.name(), entity.startDate(), entity.endDate(), entity.metric(),
                    entity.targetValue());
        }
        String sql = """
                update market_goals
                set name = ?, start_date = ?, end_date = ?, metric = ?, target_value = ?
                where id = ?
                """;
        jdbcTemplate.update(sql,
                entity.name(),
                entity.startDate(),
                entity.endDate(),
                entity.metric(),
                entity.targetValue(),
                entity.id());
        return entity;
    }

    @Override
    public Optional<MarketGoal> findById(Long id) {
        String sql = """
                select id, name, start_date, end_date, metric, target_value
                from market_goals
                where id = ?
                """;
        try {
            MarketGoal row = jdbcTemplate.queryForObject(sql, new MarketGoalMapper(), id);
            return Optional.ofNullable(row);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    @Override
    public List<MarketGoal> findAll() {
        String sql = """
                select id, name, start_date, end_date, metric, target_value
                from market_goals
                order by end_date asc, start_date asc
                """;
        return jdbcTemplate.query(sql, new MarketGoalMapper());
    }

    @Override
    public List<MarketGoal> findAllPaged(int pageNumber, int pageSize) {
        String sql = """
                select id, name, start_date, end_date, metric, target_value
                from market_goals
                order by end_date asc, start_date asc
                limit ? offset ?
                """;
        int offset = Math.max(0, pageNumber) * Math.max(1, pageSize);
        return jdbcTemplate.query(sql, new MarketGoalMapper(), pageSize, offset);
    }

    @Override
    public Long count() {
        Long n = jdbcTemplate.queryForObject("select count(*) from market_goals", Long.class);
        return n != null ? n : 0L;
    }

    @Override
    public void deleteById(Long id) {
        jdbcTemplate.update("delete from market_goals where id = ?", id);
    }

    private static class MarketGoalMapper implements RowMapper<MarketGoal> {
        @Override
        public MarketGoal mapRow(ResultSet rs, int rowNum) throws SQLException {
            return new MarketGoal(
                    rs.getLong("id"),
                    rs.getString("name"),
                    rs.getDate("start_date").toLocalDate(),
                    rs.getDate("end_date").toLocalDate(),
                    rs.getString("metric"),
                    rs.getDouble("target_value"));
        }
    }
}
