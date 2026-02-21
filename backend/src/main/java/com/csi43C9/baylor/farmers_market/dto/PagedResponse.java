package com.csi43C9.baylor.farmers_market.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

/**
 * Data Transfer Object (DTO) for encapsulating paged data.
 * @param <T> The entity type.
 */
@Data
@AllArgsConstructor
public class PagedResponse<T> {
    /**
     * The list of entities in the current page.
     */
    private List<T> data;

    /**
     * Pagination metadata.
     */
    private int pageNumber;
    private int pageSize;
    private long totalElements;
    private int totalPages;
}
