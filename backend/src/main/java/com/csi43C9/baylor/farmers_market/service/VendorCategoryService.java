package com.csi43C9.baylor.farmers_market.service;

import com.csi43C9.baylor.farmers_market.repository.VendorCategoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class VendorCategoryService {

    private final VendorCategoryRepository repo;

    public VendorCategoryService(VendorCategoryRepository repo) {
        this.repo = repo;
    }

    public List<Long> getLabelIdsForVendor(UUID vendorId) {
        return repo.findLabelIdsByVendor(vendorId);
    }

    @Transactional
    public void addLabelsToVendor(UUID vendorId, List<Long> labelIds) {
        repo.insertVendorLabels(vendorId, labelIds);
    }

    public void removeLabelFromVendor(UUID vendorId, long labelId) {
        repo.deleteVendorLabel(vendorId, labelId);
    }
}
