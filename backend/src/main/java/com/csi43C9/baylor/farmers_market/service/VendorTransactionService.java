package com.csi43C9.baylor.farmers_market.service;

import com.csi43C9.baylor.farmers_market.dto.PagedResponse;
import com.csi43C9.baylor.farmers_market.dto.vendor_transaction.RevenueBreakdown;
import com.csi43C9.baylor.farmers_market.dto.vendor_transaction.SaveVendorTransactionRequest;
import com.csi43C9.baylor.farmers_market.dto.vendor_transaction.VendorTransactionFilterRequest;
import com.csi43C9.baylor.farmers_market.entity.VendorTransaction;
import com.csi43C9.baylor.farmers_market.repository.VendorTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Service class handling the business logic for VendorTransaction management.
 */
@Service
@RequiredArgsConstructor
public class VendorTransactionService {

    private final VendorTransactionRepository vendorTransactionRepository;

    /**
     * Creates a new vendor transaction based on the provided request DTO.
     *
     * @param request The DTO containing vendor transaction details.
     * @return The fully persisted VendorTransaction entity.
     */
    public VendorTransaction create(SaveVendorTransactionRequest request) {
        VendorTransaction transaction = new RequestMapper().mapRequest(request);
        return vendorTransactionRepository.save(transaction);
    }

    /**
     * Creates multiple vendor transactions based on the provided request DTOs.
     *
     * @param requests The DTOs containing vendor transaction details.
     * @return The fully persisted VendorTransaction entities.
     */
    public List<VendorTransaction> createBulk(List<SaveVendorTransactionRequest> requests) {
        List<VendorTransaction> transactions = requests.stream()
                .map(request -> new RequestMapper().mapRequest(request))
                .toList();
        return vendorTransactionRepository.saveAll(transactions);
    }

    /**
     * Retrieves a vendor transaction by its UUID.
     * @param uuid the UUID of the vendor transaction to retrieve.
     * @return VendorTransaction
     */
    public Optional<VendorTransaction> get(UUID uuid) {
        return vendorTransactionRepository.findById(uuid);
    }

    /**
     * Updates an existing vendor transaction based on the provided request DTO.
     * @param uuid the UUID of the vendor transaction to update.
     * @param request the DTO containing updated vendor transaction details.
     * @return the updated VendorTransaction entity.
     */
    public VendorTransaction update(UUID uuid, SaveVendorTransactionRequest request) {
        VendorTransaction transaction = new RequestMapper().mapRequest(request, uuid);
        return vendorTransactionRepository.save(transaction);
    }

    /**
     * Deletes a vendor transaction from the system.
     * @param uuid the UUID of the vendor transaction to delete.
     */
    public void delete(UUID uuid) {
        vendorTransactionRepository.deleteById(uuid);
    }

    /**
     * Returns a paged list of all vendor transactions in the system.
     * @param page 0-based page number
     * @param size page size
     * @return PagedResponse
     */
    public PagedResponse<VendorTransaction> getTransactions(int page, int size) {
        List<VendorTransaction> content = vendorTransactionRepository.findAllPaged(page, size);
        long totalElements = vendorTransactionRepository.count();
        int totalPages = calculateTotalPages(totalElements, size);

        return new PagedResponse<>(
                content,
                page,
                size,
                totalElements,
                totalPages
        );
    }

    public RevenueBreakdown getRevenueBreakdownForDate(LocalDate date) {
        return vendorTransactionRepository.getRevenueBreakdownForDate(date);
    }

    public RevenueBreakdown getRevenueBreakdownForDateRange(LocalDate startDate, LocalDate endDate) {
        return vendorTransactionRepository.getRevenueBreakdownForDateRange(startDate, endDate);
    }

    /**
     * Returns a paged list of vendor transactions matching the provided filters.
     * @param filter transaction filters
     * @param page 0-based page number
     * @param size page size
     * @return paged response of matching transactions
     */
    public PagedResponse<VendorTransaction> getTransactions(VendorTransactionFilterRequest filter, int page, int size) {
        validateFilter(filter);

        List<VendorTransaction> content = vendorTransactionRepository.findFilteredPaged(filter, page, size);
        long totalElements = vendorTransactionRepository.countFiltered(filter);
        int totalPages = calculateTotalPages(totalElements, size);

        return new PagedResponse<>(
                content,
                page,
                size,
                totalElements,
                totalPages
        );
    }

    /**
     * Returns a paged list of vendor transactions for the provided vendor.
     * @param vendorId the vendor UUID
     * @param page 0-based page number
     * @param size page size
     * @return paged response of matching transactions
     */
    public PagedResponse<VendorTransaction> getTransactionsByVendorId(UUID vendorId, int page, int size) {
        List<VendorTransaction> content = vendorTransactionRepository.findByVendorIdPaged(vendorId, page, size);
        long totalElements = vendorTransactionRepository.countByVendorId(vendorId);
        int totalPages = calculateTotalPages(totalElements, size);

        return new PagedResponse<>(
                content,
                page,
                size,
                totalElements,
                totalPages
        );
    }

    private void validateFilter(VendorTransactionFilterRequest filter) {
        if (filter == null) {
            throw new IllegalArgumentException("Provide either marketDate or both startMarketDate and endMarketDate.");
        }

        LocalDate marketDate = filter.getMarketDate();
        LocalDate startMarketDate = filter.getStartMarketDate();
        LocalDate endMarketDate = filter.getEndMarketDate();
        boolean hasMarketDate = marketDate != null;
        boolean hasRangeStart = startMarketDate != null;
        boolean hasRangeEnd = endMarketDate != null;

        if (hasMarketDate && (hasRangeStart || hasRangeEnd)) {
            throw new IllegalArgumentException("marketDate cannot be combined with startMarketDate or endMarketDate.");
        }

        if (!hasMarketDate && !hasRangeStart && !hasRangeEnd) {
            throw new IllegalArgumentException("Provide either marketDate or both startMarketDate and endMarketDate.");
        }

        if (hasRangeStart != hasRangeEnd) {
            throw new IllegalArgumentException("Provide both startMarketDate and endMarketDate for a range filter.");
        }

        if (hasRangeStart && startMarketDate.isAfter(endMarketDate)) {
            throw new IllegalArgumentException("startMarketDate must be on or before endMarketDate.");
        }
    }

    private int calculateTotalPages(long totalElements, int size) {
        return size > 0 ? (int) Math.ceil((double) totalElements / size) : 0;
    }

    /**
     * Helper class for mapping vendor transaction requests to vendor transaction entities.
     */
    private static class RequestMapper {
        VendorTransaction mapRequest(SaveVendorTransactionRequest request) {
            VendorTransaction transaction = new VendorTransaction();
            transaction.setVendorId(request.getVendorId());
            transaction.setVendorName(request.getVendorName());
            transaction.setMarketDate(request.getMarketDate());
            transaction.setPresent(request.isPresent());
            transaction.setSnap(request.getSnap());
            transaction.setDufb(request.getDufb());
            transaction.setWdfmTokens(request.getWdfmTokens());
            transaction.setVoucher(request.getVoucher());
            transaction.setReimbursementDue(request.getReimbursementDue());
            transaction.setReportedSales(request.getReportedSales());
            transaction.setEstProduceSales(request.getEstProduceSales());
            transaction.setEstNumTransactions(request.getEstNumTransactions());
            return transaction;
        }

        VendorTransaction mapRequest(SaveVendorTransactionRequest request, UUID uuid) {
            VendorTransaction transaction = mapRequest(request);
            transaction.setId(uuid);
            return transaction;
        }
    }
}
