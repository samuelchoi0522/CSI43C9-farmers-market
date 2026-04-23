package com.csi43C9.baylor.farmers_market.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.List;
import java.util.Locale;

/**
 * Older local H2 files may still enforce a {@code CHECK} on {@code metric} that does not include
 * {@code ACTIVE_VENDOR_ATTENDANCE}. {@code CREATE TABLE IF NOT EXISTS} does not relax that, so inserts
 * fail with {@code DataIntegrityViolationException} (mapped to 409). This migration drops all
 * {@code CHECK} constraints on {@code market_goals} and re-adds only {@code end_date >= start_date}.
 */
@Component
@Order
public class H2MarketGoalsCheckConstraintMigration implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(H2MarketGoalsCheckConstraintMigration.class);

    private final DataSource dataSource;
    private final JdbcTemplate jdbcTemplate;

    public H2MarketGoalsCheckConstraintMigration(DataSource dataSource, JdbcTemplate jdbcTemplate) {
        this.dataSource = dataSource;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!isH2()) {
            return;
        }
        try {
            List<String> constraintNames = jdbcTemplate.query(
                    """
                            select constraint_name
                            from information_schema.table_constraints
                            where constraint_type = 'CHECK'
                              and upper(table_name) = 'MARKET_GOALS'
                            """,
                    (rs, rowNum) -> rs.getString(1));
            for (String name : constraintNames) {
                if (name == null || name.isBlank()) {
                    continue;
                }
                jdbcTemplate.execute("alter table market_goals drop constraint " + quoteH2(name));
                log.info("Dropped outdated market_goals check constraint {}", name);
            }
            jdbcTemplate.execute(
                    """
                            alter table market_goals
                            add constraint market_goals_date_range_chk check (end_date >= start_date)
                            """);
            log.debug("Ensured market_goals date-range check constraint");
        } catch (Exception e) {
            log.warn("Could not migrate market_goals check constraints (safe to ignore on fresh DB): {}", e.getMessage());
        }
    }

    private boolean isH2() {
        try (Connection c = dataSource.getConnection()) {
            String product = c.getMetaData().getDatabaseProductName();
            return product != null && product.toLowerCase(Locale.ROOT).contains("h2");
        } catch (SQLException e) {
            log.warn("Could not read database product name: {}", e.getMessage());
            return false;
        }
    }

    private static String quoteH2(String identifier) {
        String s = identifier != null ? identifier : "";
        return "\"" + s.replace("\"", "\"\"") + "\"";
    }
}
