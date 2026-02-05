package com.csi43C9.baylor.farmers_market.VendorTests;

import com.csi43C9.baylor.farmers_market.repository.VendorCategoryRepository;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;

import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.containers.MariaDBContainer;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@Testcontainers
@SpringBootTest
@ActiveProfiles("test") // picks up application-test.yml
class VendorCategoryRepositoryIT {

    @Autowired
    private VendorCategoryRepository repository;

    private UUID testVendorId;

    @BeforeEach
    void setup() {
        testVendorId = UUID.randomUUID();
        // make sure table exists, optionally truncate for isolation
    }

    @Test
    void insertAndFindLabels() {
        repository.insertVendorLabels(testVendorId, List.of(1L, 2L, 3L));

        List<Long> labels = repository.findLabelIdsByVendor(testVendorId);

        assertThat(labels).containsExactlyInAnyOrder(1L, 2L, 3L);
    }

    @Test
    void deleteLabel() {
        repository.insertVendorLabels(testVendorId, List.of(1L, 2L));

        repository.deleteVendorLabel(testVendorId, 1L);

        List<Long> labels = repository.findLabelIdsByVendor(testVendorId);

        assertThat(labels).containsExactly(2L);
    }
}