package com.csi43C9.baylor.farmers_market.controller;

import com.csi43C9.baylor.farmers_market.dto.vendor.CreateVendorRequest;
import com.csi43C9.baylor.farmers_market.entity.Vendor;
import com.csi43C9.baylor.farmers_market.service.VendorService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.NonNull;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestBody;

/**
 * REST Controller for managing vendor-related operations.
 * Provides endpoints for creating and potentially retrieving vendor information.
 * * <p>This controller is protected by JWT authentication as configured in
 * the SecurityConfig class.</p>
 */
@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/vendor")
@AllArgsConstructor
public class VendorController {

    private final VendorService vendorService;

    /**
     * Creates a new vendor in the system.
     *
     * @param request the {@link CreateVendorRequest} containing valid vendor details.
     * @return a {@link ResponseEntity} containing the created {@link Vendor}
     * and a HTTP 201 Created status.
     */
    @PostMapping
    public ResponseEntity<@NonNull Vendor> createVendor(@Valid @RequestBody CreateVendorRequest request) {
        Vendor newVendor = vendorService.createVendor(request);
        return new ResponseEntity<>(newVendor, HttpStatus.CREATED);
    }
}
