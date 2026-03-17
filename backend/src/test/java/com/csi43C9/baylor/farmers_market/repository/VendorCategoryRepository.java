package com.csi43C9.baylor.farmers_market.repository;

import com.csi43C9.baylor.farmers_market.dto.vendor.CategoryLabelDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.jdbc.test.autoconfigure.JdbcTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.TestPropertySource;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Persistence layer tests for {@link VendorCategoryRepository}.
 * Uses an in-memory database to verify SQL execution, many-to-many relationship mapping,
 * and UUID binary conversions.
 */
@JdbcTest
@Import(VendorCategoryRepository.class)
// 1. Stop Spring from overriding our custom URL
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
// 2. Supply the MySQL-compatible H2 URL
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:testdb;MODE=MySQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.driverClassName=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password="
})
class VendorCategoryRepositoryTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private VendorCategoryRepository vendorCategoryRepository;

    private UUID testVendorId;

    /**
     * Set up the required tables in the test database schema before each test.
     * Since these tables don't have JPA @Entity classes, we must create them manually for H2.
     */
    @BeforeEach
    void setUp() {
        // 1. Create the tables if they don't exist in the in-memory DB
        jdbcTemplate.execute("""
            CREATE TABLE IF NOT EXISTS category_labels (
               id BIGINT AUTO_INCREMENT PRIMARY KEY,
               name VARCHAR(255) NOT NULL,
               color VARCHAR(20)
            )
        """);

        jdbcTemplate.execute("""
            CREATE TABLE IF NOT EXISTS vendor_category_labels (
                vendor_id BINARY(16) NOT NULL,
                label_id BIGINT NOT NULL,
                PRIMARY KEY (vendor_id, label_id)
            )
        """);

        // 2. Clear tables to ensure a clean slate for each test
        jdbcTemplate.execute("DELETE FROM vendor_category_labels");
        jdbcTemplate.execute("DELETE FROM category_labels");
        jdbcTemplate.execute("DELETE FROM vendors");

        testVendorId = UUID.randomUUID();

        // 3. Insert a dummy vendor
        jdbcTemplate.update("INSERT INTO vendors (id, vendor) VALUES (?, ?)",
                vendorCategoryRepository.uuidToBytes(testVendorId), "Test Vendor");

        // 4. Insert dummy category labels
        jdbcTemplate.update("INSERT INTO category_labels (id, name, color) VALUES (?, ?, ?)", 1L, "Produce", "#10b981");
        jdbcTemplate.update("INSERT INTO category_labels (id, name, color) VALUES (?, ?, ?)", 2L, "Organic", "#22c55e");
        jdbcTemplate.update("INSERT INTO category_labels (id, name, color) VALUES (?, ?, ?)", 3L, "Baked Goods", "#f97316");
    }

    /**
     * Verifies that category labels are correctly associated with a vendor.
     */
    @Test
    void insertVendorLabelsAssociatesLabelsCorrectly() {
        List<Long> labelsToAdd = List.of(1L, 2L);

        vendorCategoryRepository.insertVendorLabels(testVendorId, labelsToAdd);

        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM vendor_category_labels WHERE vendor_id = ?",
                Integer.class, vendorCategoryRepository.uuidToBytes(testVendorId));

        assertThat(count).isEqualTo(2);
    }

    /**
     * Verifies that inserting a label that is already associated does not duplicate
     * or throw an exception (testing the INSERT IGNORE logic).
     */
    @Test
    void insertVendorLabelsHandlesDuplicatesGracefully() {
        // 1. Insert initially
        vendorCategoryRepository.insertVendorLabels(testVendorId, List.of(1L));

        // 2. Insert the same label again
        vendorCategoryRepository.insertVendorLabels(testVendorId, List.of(1L));

        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM vendor_category_labels WHERE vendor_id = ?",
                Integer.class, vendorCategoryRepository.uuidToBytes(testVendorId));

        assertThat(count).isEqualTo(1); // Should still only be 1
    }

    /**
     * Verifies that finding labels by vendor ID returns a correctly mapped list of DTOs.
     */
    @Test
    void findLabelsByVendorReturnsMappedDtos() {
        // Arrange: Manually link labels
        jdbcTemplate.update("INSERT INTO vendor_category_labels (vendor_id, label_id) VALUES (?, ?)",
                vendorCategoryRepository.uuidToBytes(testVendorId), 1L);
        jdbcTemplate.update("INSERT INTO vendor_category_labels (vendor_id, label_id) VALUES (?, ?)",
                vendorCategoryRepository.uuidToBytes(testVendorId), 3L);

        // Act
        List<CategoryLabelDto> labels = vendorCategoryRepository.findLabelsByVendor(testVendorId);

        // Assert
        assertThat(labels).hasSize(2);
        assertThat(labels).extracting(CategoryLabelDto::getName)
                .containsExactlyInAnyOrder("Produce", "Baked Goods");
    }

    /**
     * Verifies that inserting an empty list or null returns immediately without error.
     */
    @Test
    void insertVendorLabelsDoesNothingOnEmptyOrNullList() {
        vendorCategoryRepository.insertVendorLabels(testVendorId, null);
        vendorCategoryRepository.insertVendorLabels(testVendorId, List.of());

        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM vendor_category_labels WHERE vendor_id = ?",
                Integer.class, vendorCategoryRepository.uuidToBytes(testVendorId));

        assertThat(count).isEqualTo(0);
    }

    /**
     * Verifies that a new label can be created and its generated ID is returned.
     */
    @Test
    void createLabelInsertsAndReturnsGeneratedId() {
        String newLabelName = "Artisan Goods";
        String newLabelColor = "#ef4444";

        CategoryLabelDto created = vendorCategoryRepository.createLabel(newLabelName, newLabelColor);

        assertThat(created.getId()).isNotNull();
        assertThat(created.getName()).isEqualTo(newLabelName);
        assertThat(created.getColor()).isEqualTo(newLabelColor);

        // Verify it exists in DB
        String nameInDb = jdbcTemplate.queryForObject(
                "SELECT name FROM category_labels WHERE id = ?",
                String.class, created.getId());
        assertThat(nameInDb).isEqualTo(newLabelName);
    }

    /**
     * Verifies that all system labels are retrieved in alphabetical order.
     */
    @Test
    void findAllLabelsReturnsSortedList() {
        List<CategoryLabelDto> labels = vendorCategoryRepository.findAllLabels();

        assertThat(labels).hasSize(3);
        assertThat(labels.get(0).getName()).isEqualTo("Baked Goods"); // A-Z order check
        assertThat(labels.get(2).getName()).isEqualTo("Produce");
    }

    /**
     * Verifies that deleting a global label removes vendor mappings and the label row.
     */
    @Test
    void deleteCategoryLabelRemovesMappingsAndLabel() {
        jdbcTemplate.update("INSERT INTO vendor_category_labels (vendor_id, label_id) VALUES (?, ?)",
                vendorCategoryRepository.uuidToBytes(testVendorId), 1L);

        vendorCategoryRepository.deleteCategoryLabel(1L);

        Integer mappingCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM vendor_category_labels WHERE label_id = ?",
                Integer.class, 1L);
        Integer labelCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM category_labels WHERE id = ?",
                Integer.class, 1L);

        assertThat(mappingCount).isEqualTo(0);
        assertThat(labelCount).isEqualTo(0);
    }

    /**
     * Verifies that a label name can be updated.
     */
    @Test
    void updateCategoryLabelUpdatesName() {
        vendorCategoryRepository.updateCategoryLabel(2L, "Updated Name", "#1d4ed8");

        String nameInDb = jdbcTemplate.queryForObject(
                "SELECT name FROM category_labels WHERE id = ?",
                String.class, 2L);
        String colorInDb = jdbcTemplate.queryForObject(
                "SELECT color FROM category_labels WHERE id = ?",
                String.class, 2L);

        assertThat(nameInDb).isEqualTo("Updated Name");
        assertThat(colorInDb).isEqualTo("#1d4ed8");
    }

}
