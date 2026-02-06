package com.csi43C9.baylor.farmers_market.service;

import com.csi43C9.baylor.farmers_market.dto.vendor.CreateVendorRequest;
import com.csi43C9.baylor.farmers_market.entity.Vendor;
import com.csi43C9.baylor.farmers_market.repository.VendorRepository; // Added import
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class VendorService {

    private final VendorRepository vendorRepository; // Changed to VendorRepository

    public Vendor createVendor(CreateVendorRequest request) {
        Vendor vendor = new Vendor(
                request.getVendorName(),
                request.getPointPerson(),
                request.getEmail(),
                request.getLocation(),
                request.getMiles(),
                request.getProducts(),
                request.getIsFarmer(),
                request.getIsProduce(),
                request.getWomanOwned(),
                request.getBipocOwned(),
                request.getVeteranOwned()
        );
        return vendorRepository.save(vendor); // Changed to vendorRepository
    }
}
