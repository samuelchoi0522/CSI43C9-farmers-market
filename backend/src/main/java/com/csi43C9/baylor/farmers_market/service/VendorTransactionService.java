package com.csi43C9.baylor.farmers_market.service;

import com.csi43C9.baylor.farmers_market.dto.PagedResponse;
import com.csi43C9.baylor.farmers_market.dto.custom_column.CustomColumnMetadata;
import com.csi43C9.baylor.farmers_market.dto.vendor_transaction.RevenueBreakdown;
import com.csi43C9.baylor.farmers_market.dto.vendor_transaction.SaveVendorTransactionRequest;
import com.csi43C9.baylor.farmers_market.dto.vendor_transaction.VendorTransactionFilterRequest;
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
     *
     * @param request The data transfer object containing transaction details.
     * @return The saved VendorTransaction entity.
     */
    public VendorTransaction create(SaveVendorTransactionRequest request) {
        if (request.isPresent()) {
            validateCustomData(request.getCustomData());
        } else {
            // Clean up custom data if not present
            request.setCustomData(Collections.emptyMap());
        }

        VendorTransaction transaction = new RequestMapper().mapRequest(request);
        return vendorTransactionRepository.save(transaction);
    }

    /**
     * Creates multiple vendor transactions based on the provided request DTOs.
     *
     * @param requests A list of data transfer objects containing transaction details.
     * @return A list of the saved VendorTransaction entities.
     */
    public List<VendorTransaction> createBulk(List<SaveVendorTransactionRequest> requests) {
        // Validate custom data for each request
        List<CustomColumnMetadata> activeColumns = customColumnRepository.findAllActiveColumns();
        for (SaveVendorTransactionRequest req : requests) {
            if (req.isPresent()) {
                validateCustomData(req.getCustomData(), activeColumns);
            } else {
                // Clean up custom data if not present
                req.setCustomData(Collections.emptyMap());
            }
        }

        List<VendorTransaction> transactions = requests.stream()
                .map(request -> new RequestMapper().mapRequest(request))
                .toList();
        return vendorTransactionRepository.saveAll(transactions);
    }

    /**
     * Retrieves a vendor transaction by its UUID.
     *
     * @param uuid The unique identifier of the transaction.
     * @return An Optional containing the transaction if found, or empty otherwise.
     */
    public Optional<VendorTransaction> get(UUID uuid) {
        return vendorTransactionRepository.findById(uuid);
    }

    /**
     * Updates an existing vendor transaction based on the provided request DTO.
     *
     * @param uuid    The unique identifier of the transaction to update.
     * @param request The data transfer object containing updated details.
     * @return The updated VendorTransaction entity.
     */
    public VendorTransaction update(UUID uuid, SaveVendorTransactionRequest request) {
        validateCustomData(request.getCustomData());
        VendorTransaction transaction = new RequestMapper().mapRequest(request, uuid);
        return vendorTransactionRepository.save(transaction);
    }

    /**
     * Deletes a vendor transaction from the system.
     *
     * @param uuid The unique identifier of the transaction to delete.
     */
    public void delete(UUID uuid) {
        vendorTransactionRepository.deleteById(uuid);
    }

    /**
     * Returns a paged list of all vendor transactions in the system.
     *
     * @param page The page number to retrieve.
     * @param size The number of records per page.
     * @return A paged response of VendorTransaction entities.
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

    /**
     * Retrieves a revenue breakdown for a specific date.
     *
     * @param date The market date.
     * @return The revenue breakdown.
     */
    public RevenueBreakdown getRevenueBreakdownForDate(LocalDate date) {
        return vendorTransactionRepository.getRevenueBreakdownForDate(date);
    }

    /**
     * Retrieves a revenue breakdown for a specific date range.
     *
     * @param startDate The start of the date range.
     * @param endDate   The end of the date range.
     * @return The revenue breakdown.
     */
    public RevenueBreakdown getRevenueBreakdownForDateRange(LocalDate startDate, LocalDate endDate) {
        return vendorTransactionRepository.getRevenueBreakdownForDateRange(startDate, endDate);
    }

    /**
     * Returns a paged list of vendor transactions matching the provided filters.
     *
     * @param filter transaction filters
     * @param page   0-based page number
     * @param size   page size
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
     *
     * @param vendorId the vendor UUID
     * @param page     0-based page number
     * @param size     page size
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
     * Validates the custom data payload against the database's column metadata.
     * Fetches active columns directly from the repository.
     *
     * @param customData The payload containing the dynamic column data to validate.
     */
    private void validateCustomData(Map<String, Object> customData) {
        List<CustomColumnMetadata> activeColumns = customColumnRepository.findAllActiveColumns();
        validateCustomData(customData, activeColumns);
    }

    /**
     * Validates the custom data payload against the database's column metadata using column IDs.
     * Checks for required columns, data types, and rejects any unrecognized extra columns.
     *
     * @param customData    The payload containing the dynamic column data to validate.
     * @param activeColumns The list of currently active column definitions.
     * @throws IllegalArgumentException If extra columns exist, required columns are missing, or types are invalid.
     */
    private void validateCustomData(Map<String, Object> customData, List<CustomColumnMetadata> activeColumns) {
        Map<String, Object> dataToValidate = Objects.nonNull(customData) ? customData : Collections.emptyMap();

        Set<String> validColumnIds = activeColumns.stream()
                .map(column -> String.valueOf(column.id()))
                .collect(Collectors.toSet());

        // Check for extra/unrecognized columns by ID
        for (String providedKey : dataToValidate.keySet()) {
            if (!validColumnIds.contains(providedKey)) {
                throw new IllegalArgumentException("Unrecognized custom column ID provided: " + providedKey);
            }
        }

        for (CustomColumnMetadata column : activeColumns) {
            String colId = String.valueOf(column.id());
            Object value = customData.get(colId);
            boolean isMissing = Objects.isNull(value) || value.toString().isBlank();

            // Check Required Columns
            if (column.isRequired() && isMissing) {
                throw new IllegalArgumentException("Missing required field: " + column.name());
            }

            // Validate Types
            if (!isMissing) {
                String strValue = value.toString().trim();

                switch (column.type().toLowerCase()) {
                    case "boolean":
                        if (!(value instanceof Boolean) &&
                                !strValue.equalsIgnoreCase("true") &&
                                !strValue.equalsIgnoreCase("false")) {
                            throw new IllegalArgumentException(column.name() + " must be a boolean (true/false).");
                        }
                        break;

                    case "usd":
                        try {
                            // Strip formatting if the frontend accidentally sends "$1,000.00"
                            String cleanUsd = strValue.replace("$", "").replace(",", "");
                            Double.parseDouble(cleanUsd);
                        } catch (NumberFormatException e) {
                            throw new IllegalArgumentException(column.name() + " must be a valid currency amount.");
                        }
                        break;

                    case "number":
                        try {
                            Double.parseDouble(strValue);
                        } catch (NumberFormatException e) {
                            throw new IllegalArgumentException(column.name() + " must be a valid number.");
                        }
                        break;

                    case "text":
                        // Text accepts any string, no validation needed
                        break;

                    default:
                        throw new IllegalStateException("Unknown column type: " + column.type());
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
