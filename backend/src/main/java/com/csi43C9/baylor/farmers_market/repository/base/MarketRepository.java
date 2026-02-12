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
     * Performs a hard or soft delete depending on implementation.
     */
    void deleteById(ID id);
}