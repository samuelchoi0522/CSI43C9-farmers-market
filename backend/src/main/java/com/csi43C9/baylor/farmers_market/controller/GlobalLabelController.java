package com.csi43C9.baylor.farmers_market.controller;

import com.csi43C9.baylor.farmers_market.dto.vendor.CategoryLabelDto;
import com.csi43C9.baylor.farmers_market.service.VendorCategoryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@CrossOrigin(origins = {"tauri://localhost", "https://tauri.localhost", "http://localhost:3000"})
@RestController
@RequestMapping("/api/categories")
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
        CategoryLabelDto created = service.createCategoryLabel(request.getName(), request.getColor());
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

    /**
     * Updates a category label in the system.
     */
    @PutMapping("/{labelId}")
    public ResponseEntity<CategoryLabelDto> updateLabel(
            @PathVariable Long labelId,
            @Valid @RequestBody CategoryLabelDto request
    ) {
        CategoryLabelDto updated = service.updateCategoryLabel(labelId, request.getName(), request.getColor());
        return ResponseEntity.ok(updated);
    }
}
