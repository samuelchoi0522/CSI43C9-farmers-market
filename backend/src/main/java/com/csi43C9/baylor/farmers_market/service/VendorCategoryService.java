package com.csi43C9.baylor.farmers_market.service;

import com.csi43C9.baylor.farmers_market.repository.VendorCategoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Service layer for managing vendor category labels.
 * <p>
 * This service acts as the bridge between the controller/API layer and the data access layer.
 * It provides transactional boundaries for modifying vendor labels and retrieves
 * label associations for display or processing.
 */
@Service
public class VendorCategoryService {

    private final VendorCategoryRepository repo;

    public VendorCategoryService(VendorCategoryRepository repo) {
        this.repo = repo;
    }

    /**
     * Retrieves all category label IDs currently associated with a specific vendor.
     *
     * @param vendorId the unique UUID of the vendor
     * @return a list of Long IDs for the labels assigned to the vendor
     */
    public List<Long> getLabelIdsForVendor(UUID vendorId) {
        return repo.findLabelIdsByVendor(vendorId);
    }

    /**
     * Adds a list of category labels to a vendor within a transaction.
     * <p>
     * This method delegates to the repository to perform a batch insert.
     * It relies on the repository's {@code INSERT IGNORE} logic to safely handle duplicates
     * (i.e., if a vendor already has one of the provided labels, it is skipped).
     *
     * @param vendorId the unique UUID of the vendor
     * @param labelIds the list of label IDs to add
     */
    @Transactional
    public void addLabelsToVendor(UUID vendorId, List<Long> labelIds) {
        repo.insertVendorLabels(vendorId, labelIds);
    }

    /**
     * Removes a specific label association from a vendor.
     * <p>
     * This operation deletes the link between the vendor and the label if it exists.
     * If the link does not exist, the operation completes without error.
     *
     * @param vendorId the unique UUID of the vendor
     * @param labelId  the ID of the label to remove
     */
    public void removeLabelFromVendor(UUID vendorId, long labelId) {
        repo.deleteVendorLabel(vendorId, labelId);
    }
}