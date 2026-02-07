package com.csi43C9.baylor.farmers_market.repository;

import com.csi43C9.baylor.farmers_market.entity.Vendor;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.jdbc.test.autoconfigure.JdbcTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.context.annotation.Import;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Persistence layer tests for {@link VendorRepository}.
 * Uses an in-memory database to verify SQL execution and UUID binary mapping.
 */
@JdbcTest
@Import(VendorRepository.class)
class VendorRepositoryTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private VendorRepository vendorRepository;

    /**
     * Set up the vendor table in the test database schema before each test.
     */
    @BeforeEach
    void setUp() {
        jdbcTemplate.execute("""
                create table vendors (
                    id binary(16) primary key,
                    vendor VARCHAR(255) not null,
                    point_person VARCHAR(255) not null,
                    email VARCHAR(255) not null,
                    location VARCHAR(255),
                    miles INT,
                    products VARCHAR(255),
                    is_active boolean default true,
                    is_farmer boolean default false,
                    is_produce boolean default false,
                    woman_owned boolean default false,
                    bipoc_owned boolean default false,
                    veteran_owned boolean default false
                )
                """);
    }

    /**
     * Verifies that a Vendor entity is correctly persisted and its binary ID
     * is generated and stored correctly.
     */
    @Test
    void savePersistsVendorWithUuid() {
        Vendor vendor = new Vendor();
        vendor.setVendorName("Green Farms");
        vendor.setPointPerson("Jane Smith");
        vendor.setEmail("jane@green.com");

        Vendor saved = vendorRepository.save(vendor);

        assertThat(saved.getId()).isNotNull();

        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM vendors WHERE vendor = 'Green Farms'", Integer.class);
        assertThat(count).isEqualTo(1);
    }
}
