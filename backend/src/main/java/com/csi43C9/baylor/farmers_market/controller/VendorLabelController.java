package com.csi43C9.baylor.farmers_market.controller;

import com.csi43C9.baylor.farmers_market.dto.vendor.CategoryLabelDto;
import com.csi43C9.baylor.farmers_market.dto.vendor.VendorLabelRequest;
import com.csi43C9.baylor.farmers_market.service.VendorCategoryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;
import java.util.UUID;

/**
 * REST Controller for managing the general categories (labels) associated with a specific vendor.
 * Maps to the `vendor_category_labels` and `category_labels` tables.
 */
@CrossOrigin(origins = {"tauri://localhost", "https://tauri.localhost", "http://localhost:3000"})
@RestController
@RequestMapping("/api/vendors/{vendorId}/categories")
public class VendorLabelController {

    private final VendorCategoryService service;

    public VendorLabelController(VendorCategoryService service) {
        this.service = service;
    }

    /**
     * Retrieves the list of category labels currently associated with a vendor.
     * * @param vendorId the UUID of the vendor
     * @return a list of CategoryLabelDto (containing both ID and Name)
     */
    @GetMapping
    public ResponseEntity<List<CategoryLabelDto>> getVendorCategories(@PathVariable UUID vendorId) {
        List<CategoryLabelDto> categories = service.getLabelsForVendor(vendorId);
        return ResponseEntity.ok(categories);
    }

    /**
     * Adds a list of categories to a vendor.
     * Maps to inserts on `vendor_category_labels`.
     *
     * @param vendorId the UUID of the vendor
     * @param request  request body containing the list of label IDs
     */
    @PostMapping
    public ResponseEntity<Void> addLabels(
            @PathVariable UUID vendorId,
            @Valid @RequestBody VendorLabelRequest request
    ) {
        service.addLabelsToVendor(vendorId, request.getLabelIds());
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    /**
     * Removes a specific category assignment from a vendor.
     * Maps to a delete on `vendor_category_labels`.
     *
     * @param vendorId the UUID of the vendor
     * @param labelId  the ID of the category label
     */
    @DeleteMapping("/{labelId}")
    public ResponseEntity<Void> removeLabel(
            @PathVariable UUID vendorId,
            @PathVariable Long labelId
    ) {
        service.removeLabelFromVendor(vendorId, labelId);
        return ResponseEntity.noContent().build();
    }
}
