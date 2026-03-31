package com.csi43C9.baylor.farmers_market.repository;

import com.csi43C9.baylor.farmers_market.dto.vendor_transaction.VendorTransactionFilterRequest;
import com.csi43C9.baylor.farmers_market.entity.VendorTransaction;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.jdbc.test.autoconfigure.JdbcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import tools.jackson.databind.ObjectMapper;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@JdbcTest
@Import({VendorTransactionRepository.class, VendorTransactionRepositoryTest.JacksonConfig.class})
class VendorTransactionRepositoryTest {

    /**
     * Supplies the ObjectMapper bean specifically for this sliced test context.
     */
    @TestConfiguration
    static class JacksonConfig {
        @Bean
        public ObjectMapper objectMapper() {
            return new ObjectMapper();
        }
    }

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private VendorTransactionRepository vendorTransactionRepository;

    private UUID vendorOneId;
    private UUID vendorTwoId;

    @BeforeEach
    void setUp() {
        jdbcTemplate.execute("TRUNCATE TABLE vendor_transactions");
        vendorOneId = UUID.randomUUID();
        vendorTwoId = UUID.randomUUID();

        vendorTransactionRepository.save(createTransaction(vendorOneId, "Vendor One", LocalDate.of(2026, 3, 1)));
        vendorTransactionRepository.save(createTransaction(vendorOneId, "Vendor One", LocalDate.of(2026, 3, 8)));
        vendorTransactionRepository.save(createTransaction(vendorTwoId, "Vendor Two", LocalDate.of(2026, 3, 15)));
    }

    @Test
    void findFilteredPagedBySingleMarketDateReturnsMatches() {
        VendorTransactionFilterRequest filter = new VendorTransactionFilterRequest();
        filter.setMarketDate(LocalDate.of(2026, 3, 8));

        List<VendorTransaction> results = vendorTransactionRepository.findFilteredPaged(filter, 0, 10);

        assertThat(results).hasSize(1);
        assertThat(results.getFirst().getVendorName()).isEqualTo("Vendor One");
        assertThat(results.getFirst().getMarketDate()).isEqualTo(LocalDate.of(2026, 3, 8));
        assertThat(vendorTransactionRepository.countFiltered(filter)).isEqualTo(1L);
    }

    @Test
    void findFilteredPagedByDateRangeReturnsMatches() {
        VendorTransactionFilterRequest filter = new VendorTransactionFilterRequest();
        filter.setStartMarketDate(LocalDate.of(2026, 3, 1));
        filter.setEndMarketDate(LocalDate.of(2026, 3, 8));

        List<VendorTransaction> results = vendorTransactionRepository.findFilteredPaged(filter, 0, 10);

        assertThat(results).hasSize(2);
        assertThat(results).extracting(VendorTransaction::getMarketDate)
                .containsExactly(LocalDate.of(2026, 3, 8), LocalDate.of(2026, 3, 1));
        assertThat(vendorTransactionRepository.countFiltered(filter)).isEqualTo(2L);
    }

    @Test
    void findByVendorIdPagedReturnsOnlyVendorTransactions() {
        List<VendorTransaction> results = vendorTransactionRepository.findByVendorIdPaged(vendorOneId, 0, 10);

        assertThat(results).hasSize(2);
        assertThat(results).extracting(VendorTransaction::getVendorId).containsOnly(vendorOneId);
        assertThat(vendorTransactionRepository.countByVendorId(vendorOneId)).isEqualTo(2L);
    }

    @Test
    void findFilteredPagedByVendorIdReturnsOnlyMatchingVendorTransactions() {
        VendorTransactionFilterRequest filter = new VendorTransactionFilterRequest();
        filter.setVendorId(vendorOneId);

        List<VendorTransaction> results = vendorTransactionRepository.findFilteredPaged(filter, 0, 10);

        assertThat(results).hasSize(2);
        assertThat(results).extracting(VendorTransaction::getVendorId).containsOnly(vendorOneId);
        assertThat(vendorTransactionRepository.countFiltered(filter)).isEqualTo(2L);
    }

    private VendorTransaction createTransaction(UUID vendorId, String vendorName, LocalDate marketDate) {
        VendorTransaction transaction = new VendorTransaction();
        transaction.setVendorId(vendorId);
        transaction.setVendorName(vendorName);
        transaction.setMarketDate(marketDate);
        transaction.setPresent(true);
        transaction.setSnap(10.0);
        return transaction;
    }
}
