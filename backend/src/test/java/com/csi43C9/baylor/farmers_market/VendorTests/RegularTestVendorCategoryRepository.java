package com.csi43C9.baylor.farmers_market.VendorTests;

import com.csi43C9.baylor.farmers_market.repository.VendorCategoryRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;
@Repository
public class RegularTestVendorCategoryRepository {

    public static void main(String[] args) {
        // --------------------------- a
        // Setup datasource & repository
        // ---------------------------
        DriverManagerDataSource ds = new DriverManagerDataSource();
        ds.setDriverClassName("com.mysql.cj.jdbc.Driver");
        ds.setUrl("jdbc:mariadb://localhost:3306/farmers_market"); // your DB
        ds.setUsername("root");
        ds.setPassword("password"); // change as needed

        JdbcTemplate jdbc = new JdbcTemplate(ds);
        VendorCategoryRepository repository = new VendorCategoryRepository(jdbc);

        // ---------------------------
        // Ensure table exists
        // ---------------------------
        jdbc.execute("""
            CREATE TABLE IF NOT EXISTS vendor_category_labels (
                vendor_id BINARY(16) NOT NULL,
                label_id BIGINT NOT NULL,
                PRIMARY KEY (vendor_id, label_id)
            )
        """);

        // ---------------------------
        // Generate a test vendor
        // ---------------------------
        UUID testVendorId = UUID.randomUUID();
        System.out.println("Testing with vendor ID: " + testVendorId);

        try {
            // ---------------------------
            // Insert labels
            // ---------------------------
            repository.insertVendorLabels(testVendorId, List.of(1L, 2L, 3L));
            System.out.println("Inserted labels: 1, 2, 3");

            // ---------------------------
            // Fetch and display
            // ---------------------------
            List<Long> labels = repository.findLabelIdsByVendor(testVendorId);
            System.out.println("Fetched labels: " + labels);

            if (labels.containsAll(List.of(1L, 2L, 3L)) && labels.size() == 3) {
                System.out.println("Insert & fetch test PASSED");
            } else {
                System.out.println("Insert & fetch test FAILED");
            }

            // ---------------------------
            // Delete label 1
            // ---------------------------
            repository.deleteVendorLabel(testVendorId, 1L);
            System.out.println("Deleted label 1");

            // ---------------------------
            // Fetch again
            // ---------------------------
            labels = repository.findLabelIdsByVendor(testVendorId);
            System.out.println("Labels after deletion: " + labels);

            if (labels.contains(2L) && labels.size() == 2-1+1) {
                System.out.println("Delete test PASSED");
            } else {
                System.out.println("Delete test FAILED");
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}