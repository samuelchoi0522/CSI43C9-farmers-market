package com.csi43C9.baylor.farmers_market.service;

import com.csi43C9.baylor.farmers_market.dto.PagedResponse;
import com.csi43C9.baylor.farmers_market.dto.vendor_transaction.VendorTransactionFilterRequest;
import com.csi43C9.baylor.farmers_market.entity.VendorTransaction;
import com.csi43C9.baylor.farmers_market.repository.VendorTransactionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VendorTransactionServiceTest {

    @Mock
    private VendorTransactionRepository vendorTransactionRepository;

    @InjectMocks
    private VendorTransactionService vendorTransactionService;

    @Test
    void getTransactionsBySingleDateReturnsPagedResponse() {
        VendorTransactionFilterRequest filter = new VendorTransactionFilterRequest();
        filter.setMarketDate(LocalDate.of(2026, 3, 1));

        when(vendorTransactionRepository.findFilteredPaged(filter, 0, 10)).thenReturn(List.of(new VendorTransaction()));
        when(vendorTransactionRepository.countFiltered(filter)).thenReturn(1L);

        PagedResponse<VendorTransaction> result = vendorTransactionService.getTransactions(filter, 0, 10);

        assertThat(result.getData()).hasSize(1);
        assertThat(result.getTotalElements()).isEqualTo(1L);
        verify(vendorTransactionRepository).findFilteredPaged(filter, 0, 10);
    }

    @Test
    void getTransactionsRejectsMissingDateFilters() {
        VendorTransactionFilterRequest filter = new VendorTransactionFilterRequest();

        assertThatThrownBy(() -> vendorTransactionService.getTransactions(filter, 0, 10))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Provide either marketDate or both startMarketDate and endMarketDate.");
    }

    @Test
    void getTransactionsRejectsMixedSingleDateAndRangeFilters() {
        VendorTransactionFilterRequest filter = new VendorTransactionFilterRequest();
        filter.setMarketDate(LocalDate.of(2026, 3, 1));
        filter.setStartMarketDate(LocalDate.of(2026, 3, 1));
        filter.setEndMarketDate(LocalDate.of(2026, 3, 8));

        assertThatThrownBy(() -> vendorTransactionService.getTransactions(filter, 0, 10))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("marketDate cannot be combined with startMarketDate or endMarketDate.");
    }

    @Test
    void getTransactionsRejectsInvalidDateRange() {
        VendorTransactionFilterRequest filter = new VendorTransactionFilterRequest();
        filter.setStartMarketDate(LocalDate.of(2026, 3, 8));
        filter.setEndMarketDate(LocalDate.of(2026, 3, 1));

        assertThatThrownBy(() -> vendorTransactionService.getTransactions(filter, 0, 10))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("startMarketDate must be on or before endMarketDate.");
    }

    @Test
    void getTransactionsByVendorIdReturnsPagedResponse() {
        UUID vendorId = UUID.randomUUID();
        when(vendorTransactionRepository.findByVendorIdPaged(vendorId, 0, 10)).thenReturn(List.of(new VendorTransaction()));
        when(vendorTransactionRepository.countByVendorId(vendorId)).thenReturn(1L);

        PagedResponse<VendorTransaction> result = vendorTransactionService.getTransactionsByVendorId(vendorId, 0, 10);

        assertThat(result.getData()).hasSize(1);
        assertThat(result.getTotalElements()).isEqualTo(1L);
        verify(vendorTransactionRepository).findByVendorIdPaged(vendorId, 0, 10);
    }

    @Test
    void getMarketDatesReturnsRepositoryDates() {
        List<LocalDate> expected = List.of(
                LocalDate.of(2026, 3, 15),
                LocalDate.of(2026, 3, 8),
                LocalDate.of(2026, 3, 1)
        );
        when(vendorTransactionRepository.findAllMarketDates()).thenReturn(expected);

        List<LocalDate> result = vendorTransactionService.getMarketDates();

        assertThat(result).isEqualTo(expected);
        verify(vendorTransactionRepository).findAllMarketDates();
    }
}
