package com.csi43C9.baylor.farmers_market.service;

import com.csi43C9.baylor.farmers_market.dto.PagedResponse;
import com.csi43C9.baylor.farmers_market.dto.vendor.SaveVendorRequest;
import com.csi43C9.baylor.farmers_market.dto.vendor.VendorResponse;
import com.csi43C9.baylor.farmers_market.entity.Vendor;
import com.csi43C9.baylor.farmers_market.entity.VendorDefaults;
import com.csi43C9.baylor.farmers_market.repository.VendorDefaultsRepository;
import com.csi43C9.baylor.farmers_market.repository.VendorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service class handling the business logic for Vendor management.
 */
@Service
@RequiredArgsConstructor
public class VendorService {

    private final VendorRepository vendorRepository;
    private final VendorDefaultsRepository vendorDefaultsRepository;

    /**
     * Creates a new vendor based on the provided request DTO.
     *
     * @param request The DTO containing vendor details.
     * @return The fully persisted Vendor entity.
     */
    public Vendor create(SaveVendorRequest request) {
        Vendor vendor = new RequestMapper().mapRequest(request);
        return vendorRepository.save(vendor);
    }

    /**
     * Retrieves a vendor by its UUID.
     * @param uuid the UUID of the vendor to retrieve.
     * @return Vendor
     */
    public Optional<Vendor> get(UUID uuid) {
        return vendorRepository.findById(uuid);
    }

    /**
     * Retrieves a vendor response with optional defaults.
     * @param uuid the UUID of the vendor.
     * @param includeDefaults if true, includes vendor defaults.
     */
    public Optional<VendorResponse> get(UUID uuid, boolean includeDefaults) {
        return vendorRepository.findById(uuid).map(vendor -> {
            VendorResponse response = new VendorResponse();
            response.setVendor(vendor);
            if (includeDefaults) {
                response.setDefaults(vendorDefaultsRepository.findByVendorId(uuid).orElse(null));
            }
            return response;
        });
    }

    /**
     * Updates an existing vendor based on the provided request DTO.
     * @param uuid the UUID of the vendor to update.
     * @param request the DTO containing updated vendor details.
     * @return the updated Vendor entity.
     */
    public Vendor update(UUID uuid, SaveVendorRequest request) {
        Vendor vendor = new RequestMapper().mapRequest(request, uuid);
        return vendorRepository.save(vendor);
    }

    /**
     * Deletes a vendor from the system.
     * @param uuid the UUID of the vendor to delete.
     */
    public void delete(UUID uuid) {
        vendorRepository.deleteById(uuid);
    }

    /**
     * Returns a paged list of all vendors in the system.
     * @param page 0-based page number
     * @param size page size
     * @param includeInactive if true, includes inactive vendors
     * @param includeDefaults if true, includes vendor defaults
     * @return PagedResponse
     */
    public PagedResponse<VendorResponse> getVendors(int page, int size, boolean includeInactive, boolean includeDefaults) {
        List<Vendor> vendors = vendorRepository.findAllPaged(page, size, includeInactive);
        long totalElements = vendorRepository.count(includeInactive);
        int totalPages = (int) Math.ceil((double) totalElements / size);

        List<VendorResponse> content;
        if (includeDefaults && !vendors.isEmpty()) {
            List<UUID> vendorIds = vendors.stream().map(Vendor::getId).toList();
            List<VendorDefaults> allDefaults = vendorDefaultsRepository.findAllByVendorIds(vendorIds);
            Map<UUID, VendorDefaults> defaultsMap = allDefaults.stream()
                    .collect(Collectors.toMap(VendorDefaults::getVendorId, d -> d));

            content = vendors.stream().map(v -> VendorResponse.builder()
                    .vendor(v)
                    .defaults(defaultsMap.get(v.getId()))
                    .build()).toList();
        } else {
            content = vendors.stream().map(v -> VendorResponse.builder()
                    .vendor(v)
                    .build()).toList();
        }

        return new PagedResponse<>(
                content,
                page,
                size,
                totalElements,
                totalPages
        );
    }

    public PagedResponse<VendorResponse> getVendors(int page, int size, boolean includeInactive) {
        return getVendors(page, size, includeInactive, false);
    }

    public PagedResponse<VendorResponse> getVendors(int page, int size) {
        return getVendors(page, size, false, false);
    }

    /**
     * Helper class for mapping vendor requests to vendor entities.
     */
    private static class RequestMapper {
        Vendor mapRequest(SaveVendorRequest request) {
            Vendor vendor = new Vendor();
            vendor.setVendorName(request.getVendorName());
            vendor.setPointPerson(request.getPointPerson());
            vendor.setEmail(request.getEmail());
            vendor.setLocation(request.getLocation());
            vendor.setMiles(request.getMiles());
            vendor.setProducts(request.getProducts());

            // Safely unbox: null becomes false (except for isActive which defaults to true)
            vendor.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);
            vendor.setIsFarmer(Boolean.TRUE.equals(request.getIsFarmer()));
            vendor.setIsProduce(Boolean.TRUE.equals(request.getIsProduce()));
            vendor.setWomanOwned(Boolean.TRUE.equals(request.getWomanOwned()));
            vendor.setBipocOwned(Boolean.TRUE.equals(request.getBipocOwned()));
            vendor.setVeteranOwned(Boolean.TRUE.equals(request.getVeteranOwned()));
            return vendor;
        }

        Vendor mapRequest(SaveVendorRequest request, UUID uuid) {
            Vendor vendor = mapRequest(request);
            vendor.setId(uuid);
            return vendor;
        }
    }
}
