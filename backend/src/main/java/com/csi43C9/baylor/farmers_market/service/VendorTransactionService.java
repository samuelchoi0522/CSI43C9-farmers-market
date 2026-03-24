package com.csi43C9.baylor.farmers_market.service;

import com.csi43C9.baylor.farmers_market.dto.PagedResponse;
import com.csi43C9.baylor.farmers_market.dto.custom_column.CustomColumnMetadata;
import com.csi43C9.baylor.farmers_market.dto.vendor_transaction.RevenueBreakdown;
import com.csi43C9.baylor.farmers_market.dto.vendor_transaction.SaveVendorTransactionRequest;
import com.csi43C9.baylor.farmers_market.entity.VendorTransaction;
import com.csi43C9.baylor.farmers_market.repository.CustomColumnRepository;
import com.csi43C9.baylor.farmers_market.repository.VendorTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service class handling the business logic for VendorTransaction management.
 */
@Service
@RequiredArgsConstructor
public class VendorTransactionService {

    private final VendorTransactionRepository vendorTransactionRepository;
    private final CustomColumnRepository customColumnRepository;

    /**
     * Creates a new vendor transaction based on the provided request DTO.
     */
    public VendorTransaction create(SaveVendorTransactionRequest request) {
        validateCustomData(request.getCustomData());
        VendorTransaction transaction = new RequestMapper().mapRequest(request);
        return vendorTransactionRepository.save(transaction);
    }

    /**
     * Creates multiple vendor transactions based on the provided request DTOs.
     */
    public List<VendorTransaction> createBulk(List<SaveVendorTransactionRequest> requests) {
        List<CustomColumnMetadata> activeColumns = customColumnRepository.findAllActiveColumns();
        requests.forEach(req -> validateCustomData(req.getCustomData(), activeColumns));

        List<VendorTransaction> transactions = requests.stream()
                .map(request -> new RequestMapper().mapRequest(request))
                .toList();
        return vendorTransactionRepository.saveAll(transactions);
    }

    /**
     * Retrieves a vendor transaction by its UUID.
     */
    public Optional<VendorTransaction> get(UUID uuid) {
        return vendorTransactionRepository.findById(uuid);
    }

    /**
     * Updates an existing vendor transaction based on the provided request DTO.
     */
    public VendorTransaction update(UUID uuid, SaveVendorTransactionRequest request) {
        validateCustomData(request.getCustomData());
        VendorTransaction transaction = new RequestMapper().mapRequest(request, uuid);
        return vendorTransactionRepository.save(transaction);
    }

    /**
     * Deletes a vendor transaction from the system.
     */
    public void delete(UUID uuid) {
        vendorTransactionRepository.deleteById(uuid);
    }

    /**
     * Returns a paged list of all vendor transactions in the system.
     */
    public PagedResponse<VendorTransaction> getTransactions(int page, int size) {
        List<VendorTransaction> content = vendorTransactionRepository.findAllPaged(page, size);
        long totalElements = vendorTransactionRepository.count();
        int totalPages = (int) Math.ceil((double) totalElements / size);

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
     * Validates the custom data payload against the database's column metadata.
     */
    private void validateCustomData(Map<String, Object> customData) {
        List<CustomColumnMetadata> activeColumns = customColumnRepository.findAllActiveColumns();
        validateCustomData(customData, activeColumns);
    }

    /**
     * Validates the custom data payload against the database's column metadata.
     */
    private void validateCustomData(Map<String, Object> customData, List<CustomColumnMetadata> activeColumns) {
        Map<String, Object> dataToValidate = Objects.nonNull(customData) ? customData : Collections.emptyMap();

        Set<String> validColumnNames = activeColumns.stream()
                .map(CustomColumnMetadata::name)
                .collect(Collectors.toSet());

        // Check for extra/unrecognized columns
        for (String providedKey : dataToValidate.keySet()) {
            if (!validColumnNames.contains(providedKey)) {
                throw new IllegalArgumentException("Unrecognized custom column provided: " + providedKey);
            }
        }

        for (CustomColumnMetadata column : activeColumns) {
            Object value = dataToValidate.get(column.name());

            // Check Required Rule
            if (column.isRequired() && (Objects.isNull(value) || value.toString().isBlank())) {
                throw new IllegalArgumentException("Missing required custom column: " + column.name());
            }

            // Check Type Rule
            if (Objects.nonNull(value) && !value.toString().isBlank()) {
                if ("number".equals(column.type())) {
                    try {
                        Double.parseDouble(value.toString());
                    } catch (NumberFormatException e) {
                        throw new IllegalArgumentException("Column '" + column.name() + "' must be a valid number.");
                    }
                }
            }
        }

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
            transaction.setCustomData(request.getCustomData());
            return transaction;
        }

        VendorTransaction mapRequest(SaveVendorTransactionRequest request, UUID uuid) {
            VendorTransaction transaction = mapRequest(request);
            transaction.setId(uuid);
            return transaction;
        }
    }
}