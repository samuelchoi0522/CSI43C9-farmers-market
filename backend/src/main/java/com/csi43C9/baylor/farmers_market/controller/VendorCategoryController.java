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

@RestController
@RequestMapping("/vendors/{vendorId}/categories")
@PreAuthorize("isAuthenticated()")
public class VendorCategoryController {

    private final VendorCategoryService service;

    public VendorCategoryController(VendorCategoryService service) {
        this.service = service;
    }

    @GetMapping
    public List<Long> getVendorCategoryIds(@PathVariable UUID vendorId) {
        return service.getLabelIdsForVendor(vendorId);
    }

    @PostMapping
    public void addCategories(
            @PathVariable UUID vendorId,
            @RequestBody VendorLabelRequest request
    ) {
        service.addLabelsToVendor(vendorId, request.getLabelIds());
    }

    @DeleteMapping("/{labelId}")
    public void removeCategory(
            @PathVariable UUID vendorId,
            @PathVariable long labelId
    ) {
        service.removeLabelFromVendor(vendorId, labelId);
    }
}
