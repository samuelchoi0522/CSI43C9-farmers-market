package com.csi43C9.baylor.farmers_market.controller;

import com.csi43C9.baylor.farmers_market.dto.PagedResponse;
import com.csi43C9.baylor.farmers_market.dto.vendor.SaveVendorRequest;
import com.csi43C9.baylor.farmers_market.entity.Vendor;
import com.csi43C9.baylor.farmers_market.service.VendorService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.NonNull;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

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
     * @param request the {@link SaveVendorRequest} containing valid vendor details.
     * @return a {@link ResponseEntity} containing the created {@link Vendor}
     * and a HTTP 201 Created status.
     */
    @PostMapping
    public ResponseEntity<@NonNull Vendor> createVendor(@Valid @RequestBody SaveVendorRequest request) {
        return new ResponseEntity<>(vendorService.create(request), HttpStatus.CREATED);
    }

    /**
     * Retrieves a paged list of all vendors in the system.
     * @param page 0-based page number
     * @param size page size
     * @return a {@link ResponseEntity} containing a {@link PagedResponse} of {@link Vendor}s
     */
    @GetMapping
    public ResponseEntity<@NonNull PagedResponse<Vendor>> getAllVendors(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        return ResponseEntity.ok(vendorService.getVendors(page, size));
    }

    /**
     * Retrieves a vendor by its UUID.
     * @param uuid the UUID of the vendor to retrieve.
     * @return a {@link ResponseEntity} containing the requested {@link Vendor}
     */
    @GetMapping("/{uuid}")
    public ResponseEntity<@NonNull Vendor> getVendor(@PathVariable UUID uuid) {
        return vendorService.get(uuid)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /**
     * Updates an existing vendor in the system.
     * @param uuid the UUID of the vendor to update.
     * @param request the {@link SaveVendorRequest} containing updated vendor details.
     * @return a {@link ResponseEntity} containing the updated {@link Vendor}
     */
    @PatchMapping("/{uuid}")
    public ResponseEntity<@NonNull Vendor> updateVendor(@PathVariable UUID uuid, @Valid @RequestBody SaveVendorRequest request) {
        return new ResponseEntity<>(vendorService.update(uuid, request), HttpStatus.OK);
    }

    /**
     * Deletes a vendor from the system.
     * @param uuid the UUID of the vendor to delete.
     * @return a 204 No Content response if the vendor was successfully deleted.
     */
    @DeleteMapping("/{uuid}")
    public ResponseEntity<?> deleteVendor(@PathVariable UUID uuid) {
        vendorService.delete(uuid);
        return ResponseEntity.noContent().build();
    }
}
