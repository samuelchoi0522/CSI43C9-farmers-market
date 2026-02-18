package com.csi43C9.baylor.farmers_market.service;

import com.csi43C9.baylor.farmers_market.dto.PagedResponse;
import com.csi43C9.baylor.farmers_market.dto.vendor.SaveVendorRequest;
import com.csi43C9.baylor.farmers_market.entity.Vendor;
import com.csi43C9.baylor.farmers_market.repository.VendorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Service class handling the business logic for Vendor management.
 */
@Service
@RequiredArgsConstructor
public class VendorService {

    private final VendorRepository vendorRepository;

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
     * @return PagedResponse
     */
    public PagedResponse<Vendor> getVendors(int page, int size) {
        List<Vendor> content = vendorRepository.findAllPaged(page, size);
        long totalElements = vendorRepository.count();
        int totalPages = (int) Math.ceil((double) totalElements / size);

        return new PagedResponse<>(
                content,
                page,
                size,
                totalElements,
                totalPages
        );
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
            vendor.setFarmer(request.isFarmer());
            vendor.setProduce(request.isProduce());
            vendor.setWomanOwned(request.isWomanOwned());
            vendor.setBipocOwned(request.isBipocOwned());
            vendor.setVeteranOwned(request.isVeteranOwned());
            return vendor;
        }

        Vendor mapRequest(SaveVendorRequest request, UUID uuid) {
            Vendor vendor = mapRequest(request);
            vendor.setId(uuid);
            return vendor;
        }
    }
}
