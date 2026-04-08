package com.csi43C9.baylor.farmers_market.controller;

import com.csi43C9.baylor.farmers_market.dto.PagedResponse;
import com.csi43C9.baylor.farmers_market.dto.vendor.SaveVendorDefaultsRequest;
import com.csi43C9.baylor.farmers_market.entity.VendorDefaults;
import com.csi43C9.baylor.farmers_market.service.VendorDefaultsService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.NonNull;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import java.util.UUID;

/**
 * REST Controller for managing vendor defaults-related operations.
 */
@CrossOrigin(origins = {"tauri://localhost", "https://tauri.localhost", "http://localhost:3000"})
@RestController
@RequestMapping("/api/defaults")
@AllArgsConstructor
public class VendorDefaultsController {

    private final VendorDefaultsService vendorDefaultsService;

    /**
     * Creates new vendor defaults in the system.
     *
     * @param request the {@link SaveVendorDefaultsRequest} containing valid details.
     * @return a {@link ResponseEntity} containing the created {@link VendorDefaults}
     * and an HTTP 201 Created status.
     */
    @PostMapping
    public ResponseEntity<@NonNull VendorDefaults> createVendorDefaults(
            @Valid @RequestBody SaveVendorDefaultsRequest request) {
        return new ResponseEntity<>(vendorDefaultsService.create(request), HttpStatus.CREATED);
    }

    /**
     * Retrieves a paged list of all vendor defaults in the system.
     * @param page 0-based page number
     * @param size page size
     * @return a {@link ResponseEntity} containing a {@link PagedResponse} of {@link VendorDefaults}s
     */
    @GetMapping
    public ResponseEntity<@NonNull PagedResponse<VendorDefaults>> getAllVendorDefaults(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(vendorDefaultsService.getVendorDefaults(page, size));
    }

    /**
     * Retrieves vendor defaults by its UUID.
     * @param uuid the UUID of the vendor defaults to retrieve.
     * @return a {@link ResponseEntity} containing the requested {@link VendorDefaults}
     */
    @GetMapping("/{uuid}")
    public ResponseEntity<@NonNull VendorDefaults> getVendorDefaults(@PathVariable UUID uuid) {
        return vendorDefaultsService.get(uuid)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /**
     * Retrieves vendor defaults by vendor UUID.
     * @param vendorId the UUID of the vendor.
     * @return a {@link ResponseEntity} containing the requested {@link VendorDefaults}
     */
    @GetMapping("/vendor/{vendorId}")
    public ResponseEntity<@NonNull VendorDefaults> getVendorDefaultsByVendorId(@PathVariable UUID vendorId) {
        return vendorDefaultsService.getByVendorId(vendorId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /**
     * Updates existing vendor defaults in the system.
     * @param uuid the UUID of the vendor defaults to update.
     * @param request the {@link SaveVendorDefaultsRequest} containing updated details.
     * @return a {@link ResponseEntity} containing the updated {@link VendorDefaults}
     */
    @PatchMapping("/{uuid}")
    public ResponseEntity<@NonNull VendorDefaults> updateVendorDefaults(
            @PathVariable UUID uuid,
            @Valid @RequestBody SaveVendorDefaultsRequest request) {
        return new ResponseEntity<>(vendorDefaultsService.update(uuid, request), HttpStatus.OK);
    }

    /**
     * Deletes vendor defaults from the system.
     * @param uuid the UUID of the vendor defaults to delete.
     * @return a 204 No Content response if the record was successfully deleted.
     */
    @DeleteMapping("/{uuid}")
    public ResponseEntity<?> deleteVendorDefaults(@PathVariable UUID uuid) {
        vendorDefaultsService.delete(uuid);
        return ResponseEntity.noContent().build();
    }
}
