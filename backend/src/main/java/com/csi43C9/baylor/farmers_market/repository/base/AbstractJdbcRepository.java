package com.csi43C9.baylor.farmers_market.repository.base;

import org.springframework.jdbc.core.JdbcTemplate;

public abstract class AbstractJdbcRepository {
    protected final JdbcTemplate jdbcTemplate;

    protected AbstractJdbcRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }
}