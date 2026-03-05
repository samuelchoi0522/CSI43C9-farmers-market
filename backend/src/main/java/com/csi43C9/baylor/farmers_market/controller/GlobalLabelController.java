package com.csi43C9.baylor.farmers_market.controller;

import com.csi43C9.baylor.farmers_market.dto.vendor.CategoryLabelDto;
import com.csi43C9.baylor.farmers_market.service.VendorCategoryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@PreAuthorize("isAuthenticated()")
public class GlobalLabelController {

    private final VendorCategoryService service;

    public GlobalLabelController(VendorCategoryService service) {
        this.service = service;
    }

    /**
     * Adds a new category label to the system (master list).
     */
    @PostMapping
    public ResponseEntity<CategoryLabelDto> createLabel(@Valid @RequestBody CategoryLabelDto request) {
        CategoryLabelDto created = service.createCategoryLabel(request.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Retrieves all available category labels in the system.
     */
    @GetMapping
    public ResponseEntity<List<CategoryLabelDto>> getAllLabels() {
        return ResponseEntity.ok(service.getAllAvailableLabels());
    }

    /**
     * Deletes a category label from the system.
     */
    @DeleteMapping("/{labelId}")
    public ResponseEntity<Void> deleteLabel(@PathVariable Long labelId) {
        service.deleteCategoryLabel(labelId);
        return ResponseEntity.noContent().build();
    }
}
