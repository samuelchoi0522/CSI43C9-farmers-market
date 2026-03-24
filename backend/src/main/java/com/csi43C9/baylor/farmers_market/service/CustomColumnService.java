package com.csi43C9.baylor.farmers_market.service;

import com.csi43C9.baylor.farmers_market.dto.PagedResponse;
import com.csi43C9.baylor.farmers_market.dto.custom_column.CustomColumnMetadata;
import com.csi43C9.baylor.farmers_market.repository.CustomColumnRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;
import java.util.Optional;

/**
 * Service class handling the business logic for CustomColumnMetadata.
 */
@Service
public class CustomColumnService {

    private final CustomColumnRepository customColumnRepository;

    /**
     * Constructs the CustomColumnService.
     *
     * @param customColumnRepository The repository for database operations.
     */
    public CustomColumnService(CustomColumnRepository customColumnRepository) {
        this.customColumnRepository = customColumnRepository;
    }

    /**
     * Retrieves all custom columns without pagination.
     *
     * @return A list of all custom columns.
     */
    public List<CustomColumnMetadata> getAllColumns() {
        return customColumnRepository.findAll();
    }

    /**
     * Retrieves a paginated list of custom columns.
     *
     * @param page The page number.
     * @param size The size of the page.
     * @return A paged response of custom columns.
     */
    public PagedResponse<CustomColumnMetadata> getPagedColumns(int page, int size) {
        List<CustomColumnMetadata> content = customColumnRepository.findAllPaged(page, size);
        long totalElements = customColumnRepository.count();
        int totalPages = size > 0 ? (int) Math.ceil((double) totalElements / size) : 0;

        return new PagedResponse<>(
                content,
                page,
                size,
                totalElements,
                totalPages
        );
    }

    /**
     * Retrieves only the active custom columns.
     *
     * @return A list of active custom columns.
     */
    public List<CustomColumnMetadata> getActiveColumns() {
        return customColumnRepository.findAllActiveColumns();
    }

    /**
     * Retrieves a custom column by its ID.
     *
     * @param id The ID of the column.
     * @return An Optional containing the column if found.
     */
    public Optional<CustomColumnMetadata> getColumnById(Long id) {
        return customColumnRepository.findById(id);
    }

    /**
     * Creates a new custom column.
     *
     * @param metadata The column details to create.
     * @return The created custom column.
     * @throws IllegalArgumentException if the column type is invalid.
     */
    public CustomColumnMetadata createColumn(CustomColumnMetadata metadata) {
        validateColumnType(metadata.type());
        return customColumnRepository.save(metadata);
    }

    /**
     * Updates an existing custom column.
     *
     * @param id       The ID of the column to update.
     * @param metadata The updated column details.
     * @return The updated custom column.
     * @throws IllegalArgumentException if the column is not found or type is invalid.
     */
    public CustomColumnMetadata updateColumn(Long id, CustomColumnMetadata metadata) {
        if (customColumnRepository.findById(id).isEmpty()) {
            throw new IllegalArgumentException("Custom column not found with ID: " + id);
        }

        validateColumnType(metadata.type());

        CustomColumnMetadata updatedColumn = new CustomColumnMetadata(
                id,
                metadata.name(),
                metadata.type(),
                metadata.isRequired()
        );
        return customColumnRepository.save(updatedColumn);
    }

    /**
     * Deactivates a custom column (soft delete).
     *
     * @param id The ID of the column to deactivate.
     */
    public void deactivateColumn(Long id) {
        customColumnRepository.deactivate(id);
    }

    /**
     * Physically deletes a custom column.
     *
     * @param id The ID of the column to delete.
     */
    public void deleteColumn(Long id) {
        customColumnRepository.deleteById(id);
    }

    /**
     * Validates that the column type matches the database check constraints.
     *
     * @param type The type to validate.
     * @throws IllegalArgumentException if the type is not 'text' or 'number'.
     */
    private void validateColumnType(String type) {
        if (Objects.isNull(type) || (!type.equals("text") && !type.equals("number"))) {
            throw new IllegalArgumentException("Column type must be exactly 'text' or 'number'.");
        }
    }
}
