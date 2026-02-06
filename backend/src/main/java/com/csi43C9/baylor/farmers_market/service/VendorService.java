package com.csi43C9.baylor.farmers_market.service;

import com.csi43C9.baylor.farmers_market.dto.vendor.CreateVendorRequest;
import com.csi43C9.baylor.farmers_market.entity.Vendor;
import com.csi43C9.baylor.farmers_market.repository.VendorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

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
    public Vendor createVendor(CreateVendorRequest request) {
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

        return vendorRepository.save(vendor);
    }
}