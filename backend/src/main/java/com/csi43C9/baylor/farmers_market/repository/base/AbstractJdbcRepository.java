package com.csi43C9.baylor.farmers_market.repository.base;

import org.springframework.jdbc.core.JdbcTemplate;

/**
 * Abstract base class for JDBC-based repositories.
 */
public abstract class AbstractJdbcRepository {
    protected final JdbcTemplate jdbcTemplate;

    protected AbstractJdbcRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }
}
