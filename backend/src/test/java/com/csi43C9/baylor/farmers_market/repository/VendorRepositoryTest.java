package com.csi43C9.baylor.farmers_market.repository;

import com.csi43C9.baylor.farmers_market.entity.Vendor;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.jdbc.test.autoconfigure.JdbcTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.context.annotation.Import;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

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
        jdbcTemplate.execute("TRUNCATE TABLE vendors");
    }

    /**
     * Verifies that a Vendor entity is correctly persisted and its binary ID
     * is generated and stored correctly.
     */
    @Test
    void savePersistsVendorWithUuid() {
        Vendor saved = vendorRepository.save(createDummyVendor("Green Farms"));

        assertThat(saved.getId()).isNotNull();

        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM vendors WHERE vendor = 'Green Farms'", Integer.class);
        assertThat(count).isEqualTo(1);
    }

    /**
     * Verifies that an existing Vendor entity is correctly updated when saved again.
     */
    @Test
    void saveUpdatesExistingVendorOnConflict() {
        // 1. Insert initial vendor
        Vendor saved = vendorRepository.save(createDummyVendor("Original Name"));
        UUID id = saved.getId();

        // 2. Modify and save again (Upsert)
        saved.setVendorName("Updated Name");
        vendorRepository.save(saved);

        // 3. Verify
        Optional<Vendor> result = vendorRepository.findById(id);
        assertThat(result).isPresent();
        assertThat(result.get().getVendorName()).isEqualTo("Updated Name");

        // Ensure no new row was created
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM vendors", Integer.class);
        assertThat(count).isEqualTo(1);
    }

    /**
     * Verifies that findAllPaged() returns the correct page of results.
     */
    @Test
    void findAllPagedReturnsCorrectSlice() {
        // Insert 3 vendors
        for (int i = 1; i <= 3; i++) {
            vendorRepository.save(createDummyVendor("Vendor " + i));
        }

        // Fetch page 0, size 2
        List<Vendor> page = vendorRepository.findAllPaged(0, 2);
        assertThat(page).hasSize(2);

        // Fetch page 1, size 2
        List<Vendor> page2 = vendorRepository.findAllPaged(1, 2);
        assertThat(page2).hasSize(1);
    }

    /**
     * Verifies that findAll() excludes soft-deleted vendors.
     */
    @Test
    void findAllExcludesSoftDeletedVendors() {
        // Insert two vendors, delete one
        Vendor v1 = createDummyVendor("Vendor 1");
        Vendor v2 = createDummyVendor("Vendor 2");
        vendorRepository.save(v1);
        Vendor saved2 = vendorRepository.save(v2);

        vendorRepository.deleteById(saved2.getId());

        // Act
        List<Vendor> activeVendors = vendorRepository.findAllPaged(0, 10);

        // Assert
        assertThat(activeVendors).hasSize(1);
        assertThat(activeVendors.getFirst().getVendorName()).isEqualTo("Vendor 1");
    }

    /**
     * Verifies that findById() returns an empty Optional when the ID is not found.
     */
    @Test
    void findByIdReturnsEmptyWhenNotFound() {
        Optional<Vendor> result = vendorRepository.findById(UUID.randomUUID());
        assertThat(result).isEmpty();
    }

    /**
     * Verifies that deleteById() removes the specified vendor from the database.
     */
    @Test
    void deleteByIdRemovesVendor() {
        // 1. Arrange: Insert a vendor to delete
        Vendor saved = vendorRepository.save(createDummyVendor("Delete Me"));
        UUID id = saved.getId();

        // 2. Act
        vendorRepository.deleteById(id);

        // 3. Assert
        List<Vendor> all = vendorRepository.findAll();
        assertThat(all).isEmpty();
        assertThat(vendorRepository.count()).isEqualTo(0);
    }

    /**
     * Creates a dummy Vendor entity with the specified name.
     * @param name Vendor name
     * @return Vendor
     */
    private Vendor createDummyVendor(String name) {
        return Vendor.builder().vendorName(name).isActive(true).build();
    }
}
