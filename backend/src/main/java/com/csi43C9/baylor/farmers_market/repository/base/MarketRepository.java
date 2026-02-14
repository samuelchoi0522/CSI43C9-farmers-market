package com.csi43C9.baylor.farmers_market.repository.base;

import java.util.List;
import java.util.Optional;

/**
 * Generic repository for CRUD operations across different ID types.
 * @param <T> The entity type.
 * @param <ID> The primary key type (e.g., UUID or Integer).
 */
public interface MarketRepository<T, ID> {

    /**
     * Persists a new record or updates an existing one.
     */
    T save(T entity);

    /**
     * Finds a record by its unique ID.
     */
    Optional<T> findById(ID id);

    /**
     * Retrieves all records of type T.
     */
    List<T> findAll();

    /**
     * Retrieves a paged list of records.
     */
    List<T> findAllPaged(int pageNumber, int pageSize);

    /**
     * Returns the total number of records in the database.
     * @return the total number of records
     */
    Long count();

    /**
     * Performs a hard or soft delete depending on implementation.
     * @param id The ID of the record to delete.
     */
    void deleteById(ID id);
}
