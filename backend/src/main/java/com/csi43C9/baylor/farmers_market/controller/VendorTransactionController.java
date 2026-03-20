package com.csi43C9.baylor.farmers_market.controller;

import com.csi43C9.baylor.farmers_market.dto.PagedResponse;
import com.csi43C9.baylor.farmers_market.dto.vendor_transaction.RevenueBreakdown;
import com.csi43C9.baylor.farmers_market.dto.vendor_transaction.SaveVendorTransactionRequest;
import com.csi43C9.baylor.farmers_market.entity.VendorTransaction;
import com.csi43C9.baylor.farmers_market.service.VendorTransactionService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.NonNull;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * REST Controller for managing vendor transaction-related operations.
 * <p>This controller is protected by JWT authentication as configured in
 * the SecurityConfig class.</p>
 */
@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/vendor-transaction")
@AllArgsConstructor
public class VendorTransactionController {

    private final VendorTransactionService vendorTransactionService;

    /**
     * Creates a new vendor transaction in the system.
     *
     * @param request the {@link SaveVendorTransactionRequest} containing valid transaction details.
     * @return a {@link ResponseEntity} containing the created {@link VendorTransaction}
     * and a HTTP 201 Created status.
     */
    @PostMapping
    public ResponseEntity<@NonNull VendorTransaction> createVendorTransaction(
            @Valid @RequestBody SaveVendorTransactionRequest request) {
        return new ResponseEntity<>(vendorTransactionService.create(request), HttpStatus.CREATED);
    }

    /**
     * Creates multiple vendor transactions in the system.
     *
     * @param requests the {@link SaveVendorTransactionRequest} list containing valid transaction details.
     * @return a {@link ResponseEntity} containing the created {@link VendorTransaction} list
     * and a HTTP 201 Created status.
     */
    @PostMapping("/batch")
    public ResponseEntity<@NonNull List<VendorTransaction>> createVendorTransactions(
            @Valid @RequestBody List<SaveVendorTransactionRequest> requests) {
        return new ResponseEntity<>(vendorTransactionService.createBulk(requests), HttpStatus.CREATED);
    }

    /**
     * Retrieves a paged list of all vendor transactions in the system.
     *
     * @param page 0-based page number
     * @param size page size
     * @return a {@link ResponseEntity} containing a {@link PagedResponse} of {@link VendorTransaction}s
     */
    @GetMapping
    public ResponseEntity<@NonNull PagedResponse<VendorTransaction>> getAllVendorTransactions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        return ResponseEntity.ok(vendorTransactionService.getTransactions(page, size));
    }

    /**
     * Retrieves a vendor transaction by its UUID.
     *
     * @param uuid the UUID of the vendor transaction to retrieve.
     * @return a {@link ResponseEntity} containing the requested {@link VendorTransaction}
     */
    @GetMapping("/{uuid}")
    public ResponseEntity<@NonNull VendorTransaction> getVendorTransaction(@PathVariable UUID uuid) {
        return vendorTransactionService.get(uuid)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /**
     * Updates an existing vendor transaction in the system.
     *
     * @param uuid    the UUID of the vendor transaction to update.
     * @param request the {@link SaveVendorTransactionRequest} containing updated transaction details.
     * @return a {@link ResponseEntity} containing the updated {@link VendorTransaction}
     */
    @PatchMapping("/{uuid}")
    public ResponseEntity<@NonNull VendorTransaction> updateVendorTransaction(
            @PathVariable UUID uuid,
            @Valid @RequestBody SaveVendorTransactionRequest request) {
        return new ResponseEntity<>(vendorTransactionService.update(uuid, request), HttpStatus.OK);
    }

    /**
     * Deletes a vendor transaction from the system.
     *
     * @param uuid the UUID of the vendor transaction to delete.
     * @return a 204 No Content response if the transaction was successfully deleted.
     */
    @DeleteMapping("/{uuid}")
    public ResponseEntity<?> deleteVendorTransaction(@PathVariable UUID uuid) {
        vendorTransactionService.delete(uuid);
        return ResponseEntity.noContent().build();
    }

    /**
     * Retrieves the vendor revenue breakdown for a specific date.
     *
     * @param date the market date to query, strictly formatted as YYYY-MM-DD
     * @return a ResponseEntity containing the revenue breakdown
     */
    @GetMapping("/revenue")
    public ResponseEntity<@NonNull RevenueBreakdown> getRevenueBreakdownForDate(
            @RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(vendorTransactionService.getRevenueBreakdownForDate(date));
    }
}
