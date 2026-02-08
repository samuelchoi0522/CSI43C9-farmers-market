package com.csi43C9.baylor.farmers_market.controller;

import com.csi43C9.baylor.farmers_market.dto.VendorLabelRequest;
import com.csi43C9.baylor.farmers_market.service.VendorCategoryService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * REST Controller for managing the categories (labels) associated with a specific vendor.
 * <p>
 * This controller provides endpoints to retrieve the current categories for a vendor,
 * add new categories in bulk, and remove specific categories.
 * All endpoints require the user to be authenticated.
 */
@RestController
@RequestMapping("/vendors/{vendorId}/categories")
@PreAuthorize("isAuthenticated()")
public class VendorCategoryController {

    private final VendorCategoryService service;

    public VendorCategoryController(VendorCategoryService service) {
        this.service = service;
    }

    /**
     * Retrieves the list of category label IDs currently associated with a vendor.
     *
     * @param vendorId the UUID of the vendor to fetch categories for
     * @return a list of Long IDs representing the categories assigned to the vendor
     */
    @GetMapping
    public List<Long> getVendorCategoryIds(@PathVariable UUID vendorId) {
        return service.getLabelIdsForVendor(vendorId);
    }

    /**
     * Adds a list of categories to a vendor.
     * <p>
     * This endpoint accepts a list of label IDs and associates them with the specified vendor.
     * If a label is already associated with the vendor, it is ignored (idempotent for duplicates).
     *
     * @param vendorId the UUID of the vendor to add categories to
     * @param request  the request body containing the list of label IDs to add
     */
    @PostMapping
    public void addCategories(
            @PathVariable UUID vendorId,
            @RequestBody VendorLabelRequest request
    ) {
        service.addLabelsToVendor(vendorId, request.getLabelIds());
    }

    /**
     * Removes a specific category assignment from a vendor.
     *
     * @param vendorId the UUID of the vendor
     * @param labelId  the ID of the specific category label to remove
     */
    @DeleteMapping("/{labelId}")
    public void removeCategory(
            @PathVariable UUID vendorId,
            @PathVariable long labelId
    ) {
        service.removeLabelFromVendor(vendorId, labelId);
    }
}
