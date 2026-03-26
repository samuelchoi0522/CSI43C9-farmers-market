package com.csi43C9.baylor.farmers_market.controller;

import com.csi43C9.baylor.farmers_market.dto.PagedResponse;
import com.csi43C9.baylor.farmers_market.dto.custom_column.CustomColumnMetadata;
import com.csi43C9.baylor.farmers_market.service.CustomColumnService;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Optional;

/**
 * REST controller for managing CustomColumnMetadata.
 */
@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/custom-columns")
public class CustomColumnController {

    private final CustomColumnService customColumnService;

    /**
     * Constructs the CustomColumnController.
     *
     * @param customColumnService The service handling business logic.
     */
    public CustomColumnController(CustomColumnService customColumnService) {
        this.customColumnService = customColumnService;
    }

    /**
     * Retrieves a paged list of all custom columns.
     *
     * @param page The 0-based page number (defaults to 0).
     * @param size The page size (defaults to 10).
     * @return A paged response of custom columns.
     */
    @GetMapping
    public ResponseEntity<PagedResponse<CustomColumnMetadata>> getPagedColumns(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(customColumnService.getPagedColumns(page, size));
    }

    /**
     * Gets all custom columns without pagination.
     *
     * @return A list of all custom columns.
     */
    @GetMapping("/all")
    public ResponseEntity<List<CustomColumnMetadata>> getAllColumns() {
        return ResponseEntity.ok(customColumnService.getAllColumns());
    }

    /**
     * Gets only the active custom columns.
     *
     * @return A list of active custom columns.
     */
    @GetMapping("/active")
    public ResponseEntity<List<CustomColumnMetadata>> getActiveColumns() {
        return ResponseEntity.ok(customColumnService.getActiveColumns());
    }

    /**
     * Gets a specific custom column by ID.
     *
     * @param id The ID of the column.
     * @return The custom column if found, or a 404 Not Found response.
     */
    @GetMapping("/{id}")
    public ResponseEntity<CustomColumnMetadata> getColumnById(@PathVariable Long id) {
        Optional<CustomColumnMetadata> column = customColumnService.getColumnById(id);
        return column.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /**
     * Creates a new custom column.
     *
     * @param metadata The custom column data to create.
     * @return The created custom column.
     */
    @PostMapping
    public ResponseEntity<CustomColumnMetadata> createColumn(@RequestBody CustomColumnMetadata metadata) {
        CustomColumnMetadata createdColumn = customColumnService.createColumn(metadata);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdColumn);
    }

    /**
     * Updates an existing custom column.
     *
     * @param id       The ID of the column to update.
     * @param metadata The updated column data.
     * @return The updated custom column.
     */
    @PutMapping("/{id}")
    public ResponseEntity<CustomColumnMetadata> updateColumn(
            @PathVariable Long id,
            @RequestBody CustomColumnMetadata metadata) {
        try {
            CustomColumnMetadata updatedColumn = customColumnService.updateColumn(id, metadata);
            return ResponseEntity.ok(updatedColumn);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Deactivates a custom column (soft delete).
     *
     * @param id The ID of the column to deactivate.
     * @return A 204 No Content response.
     */
    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivateColumn(@PathVariable Long id) {
        customColumnService.deactivateColumn(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Reactivates a custom column.
     *
     * @param id The ID of the column to reactivate.
     * @return A 204 No Content response.
     */
    @PatchMapping("/{id}/reactivate")
    public ResponseEntity<Void> reactivateColumn(@PathVariable Long id) {
        customColumnService.reactivateColumn(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Physically deletes a custom column.
     *
     * @param id The ID of the column to delete.
     * @return A 204 No Content response.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteColumn(@PathVariable Long id) {
        customColumnService.deleteColumn(id);
        return ResponseEntity.noContent().build();
    }
}
