package com.csi43C9.baylor.farmers_market.controller;

import com.csi43C9.baylor.farmers_market.dto.PagedResponse;
import com.csi43C9.baylor.farmers_market.dto.vendor_transaction.VendorTransactionFilterRequest;
import com.csi43C9.baylor.farmers_market.entity.VendorTransaction;
import com.csi43C9.baylor.farmers_market.service.VendorTransactionService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(VendorTransactionController.class)
class VendorTransactionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private VendorTransactionService vendorTransactionService;

    @Test
    void getFilteredTransactionsBySingleDateReturnsPagedResponse() throws Exception {
        VendorTransaction transaction = new VendorTransaction();
        transaction.setId(UUID.randomUUID());
        transaction.setVendorName("Fresh Farm");
        transaction.setMarketDate(LocalDate.of(2026, 3, 1));

        PagedResponse<VendorTransaction> response = new PagedResponse<>(List.of(transaction), 0, 10, 1L, 1);
        when(vendorTransactionService.getTransactions(any(VendorTransactionFilterRequest.class), eq(0), eq(10)))
                .thenReturn(response);

        mockMvc.perform(get("/api/vendor-transaction/search")
                        .param("marketDate", "2026-03-01"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].vendorName").value("Fresh Farm"))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void getFilteredTransactionsByVendorIdReturnsPagedResponse() throws Exception {
        UUID vendorId = UUID.randomUUID();
        VendorTransaction transaction = new VendorTransaction();
        transaction.setId(UUID.randomUUID());
        transaction.setVendorId(vendorId);
        transaction.setVendorName("Fresh Farm");

        PagedResponse<VendorTransaction> response = new PagedResponse<>(List.of(transaction), 0, 10, 1L, 1);
        when(vendorTransactionService.getTransactions(any(VendorTransactionFilterRequest.class), eq(0), eq(10)))
                .thenReturn(response);

        mockMvc.perform(get("/api/vendor-transaction/search")
                        .param("vendorId", vendorId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].vendorId").value(vendorId.toString()))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void getTransactionsByVendorIdReturnsPagedResponse() throws Exception {
        UUID vendorId = UUID.randomUUID();
        VendorTransaction transaction = new VendorTransaction();
        transaction.setId(UUID.randomUUID());
        transaction.setVendorId(vendorId);
        transaction.setVendorName("Fresh Farm");

        PagedResponse<VendorTransaction> response = new PagedResponse<>(List.of(transaction), 0, 10, 1L, 1);
        when(vendorTransactionService.getTransactionsByVendorId(vendorId, 0, 10)).thenReturn(response);

        mockMvc.perform(get("/api/vendor-transaction/vendor/" + vendorId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].vendorId").value(vendorId.toString()))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void getVendorTransactionByIdNotFoundReturns404() throws Exception {
        when(vendorTransactionService.get(any(UUID.class))).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/vendor-transaction/" + UUID.randomUUID()))
                .andExpect(status().isNotFound());
    }

    @Test
    void deleteVendorTransactionReturnsNoContent() throws Exception {
        UUID id = UUID.randomUUID();

        mockMvc.perform(delete("/api/vendor-transaction/" + id))
                .andExpect(status().isNoContent());

        verify(vendorTransactionService).delete(id);
    }
}
