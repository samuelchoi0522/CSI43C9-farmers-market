package com.csi43C9.baylor.farmers_market.service;

import com.csi43C9.baylor.farmers_market.dto.PagedResponse;
import com.csi43C9.baylor.farmers_market.dto.vendor.SaveVendorDefaultsRequest;
import com.csi43C9.baylor.farmers_market.entity.VendorDefaults;
import com.csi43C9.baylor.farmers_market.repository.VendorDefaultsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Service class handling the business logic for Vendor Defaults management.
 */
@Service
@RequiredArgsConstructor
public class VendorDefaultsService {

    private final VendorDefaultsRepository vendorDefaultsRepository;

    /**
     * Creates new vendor defaults based on the provided request DTO.
     *
     * @param request The DTO containing vendor defaults details.
     * @return The fully persisted VendorDefaults entity.
     */
    public VendorDefaults create(SaveVendorDefaultsRequest request) {
        validatePercentages(request);
        VendorDefaults defaults = new RequestMapper().mapRequest(request);
        return vendorDefaultsRepository.save(defaults);
    }

    /**
     * Retrieves vendor defaults by its UUID.
     *
     * @param uuid the UUID of the vendor defaults to retrieve.
     * @return VendorDefaults
     */
    public Optional<VendorDefaults> get(UUID uuid) {
        return vendorDefaultsRepository.findById(uuid);
    }

    /**
     * Retrieves vendor defaults by vendor UUID.
     *
     * @param vendorId the UUID of the vendor.
     * @return VendorDefaults
     */
    public Optional<VendorDefaults> getByVendorId(UUID vendorId) {
        return vendorDefaultsRepository.findByVendorId(vendorId);
    }

    /**
     * Updates existing vendor defaults based on the provided request DTO.
     *
     * @param uuid    the UUID of the vendor defaults to update.
     * @param request the DTO containing updated vendor defaults details.
     * @return the updated VendorDefaults entity.
     */
    public VendorDefaults update(UUID uuid, SaveVendorDefaultsRequest request) {
        validatePercentages(request);
        VendorDefaults defaults = new RequestMapper().mapRequest(request, uuid);
        return vendorDefaultsRepository.save(defaults);
    }

    /**
     * Deletes vendor defaults from the system.
     *
     * @param uuid the UUID of the vendor defaults to delete.
     */
    public void delete(UUID uuid) {
        vendorDefaultsRepository.deleteById(uuid);
    }

    /**
     * Returns a paged list of all vendor defaults in the system.
     *
     * @param page 0-based page number
     * @param size page size
     * @return PagedResponse
     */
    public PagedResponse<VendorDefaults> getVendorDefaults(int page, int size) {
        List<VendorDefaults> content = vendorDefaultsRepository.findAllPaged(page, size);
        long totalElements = vendorDefaultsRepository.count();
        int totalPages = (int) Math.ceil((double) totalElements / size);

        return new PagedResponse<>(
                content,
                page,
                size,
                totalElements,
                totalPages);
    }

    /**
     * Validates that the sum of product category percentages is exactly 100.00.
     */
    private void validatePercentages(SaveVendorDefaultsRequest request) {
        BigDecimal total = BigDecimal.ZERO;

        total = total.add(Optional.ofNullable(request.getPctHandmade()).orElse(BigDecimal.ZERO));
        total = total.add(Optional.ofNullable(request.getPctAgricultural()).orElse(BigDecimal.ZERO));
        total = total.add(Optional.ofNullable(request.getPctPreparedFood()).orElse(BigDecimal.ZERO));
        total = total.add(Optional.ofNullable(request.getPctCottageGoods()).orElse(BigDecimal.ZERO));
        total = total.add(Optional.ofNullable(request.getPctManufactured()).orElse(BigDecimal.ZERO));

        // Allow vendor defaults that only specify average sale (or intentionally omit
        // category defaults) by skipping validation when the total is 0.00.
        if (total.compareTo(BigDecimal.ZERO) == 0) {
            return;
        }

        if (total.compareTo(new BigDecimal("100.00")) != 0) {
            throw new IllegalArgumentException(
                    "The sum of percentages must be exactly 100.00. Current total: " + total);
        }
    }

    /**
     * Helper class for mapping vendor defaults requests to vendor defaults
     * entities.
     */
    private static class RequestMapper {
        VendorDefaults mapRequest(SaveVendorDefaultsRequest request) {
            VendorDefaults defaults = new VendorDefaults();
            defaults.setVendorId(request.getVendorId());
            defaults.setPctHandmade(Optional.ofNullable(request.getPctHandmade()).orElse(BigDecimal.ZERO));
            defaults.setPctAgricultural(Optional.ofNullable(request.getPctAgricultural()).orElse(BigDecimal.ZERO));
            defaults.setPctPreparedFood(Optional.ofNullable(request.getPctPreparedFood()).orElse(BigDecimal.ZERO));
            defaults.setPctCottageGoods(Optional.ofNullable(request.getPctCottageGoods()).orElse(BigDecimal.ZERO));
            defaults.setPctManufactured(Optional.ofNullable(request.getPctManufactured()).orElse(BigDecimal.ZERO));
            defaults.setAvgSale(request.getAvgSale());
            return defaults;
        }

        VendorDefaults mapRequest(SaveVendorDefaultsRequest request, UUID uuid) {
            VendorDefaults defaults = mapRequest(request);
            defaults.setId(uuid);
            return defaults;
        }
    }
}
