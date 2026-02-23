package com.csi43C9.baylor.farmers_market.service;

import com.csi43C9.baylor.farmers_market.dto.vendor.CategoryLabelDto;
import com.csi43C9.baylor.farmers_market.repository.VendorCategoryRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link VendorCategoryService}.
 * Focuses on business logic, null-safety checks, and repository delegation.
 */
@ExtendWith(MockitoExtension.class)
class VendorCategoryServiceTest {

    @Mock
    private VendorCategoryRepository repo;

    @InjectMocks
    private VendorCategoryService service;

    /**
     * Verifies that the service retrieves and returns the exact list of DTOs
     * provided by the repository.
     */
    @Test
    void getLabelsForVendorReturnsMappedDtos() {
        UUID vendorId = UUID.randomUUID();
        List<CategoryLabelDto> expectedLabels = List.of(
                new CategoryLabelDto(1L, "Produce"),
                new CategoryLabelDto(2L, "Organic")
        );

        when(repo.findLabelsByVendor(vendorId)).thenReturn(expectedLabels);

        List<CategoryLabelDto> actualLabels = service.getLabelsForVendor(vendorId);

        assertThat(actualLabels).hasSize(2);
        assertThat(actualLabels).containsExactlyElementsOf(expectedLabels);
        verify(repo).findLabelsByVendor(vendorId);
    }

    /**
     * Verifies that the service successfully delegates to the repository
     * when provided with a valid, non-empty list of label IDs.
     */
    @Test
    void addLabelsToVendorCallsRepositoryWhenListIsValid() {
        UUID vendorId = UUID.randomUUID();
        List<Long> labelIds = List.of(1L, 2L, 3L);

        service.addLabelsToVendor(vendorId, labelIds);

        verify(repo).insertVendorLabels(vendorId, labelIds);
    }

    /**
     * Verifies that the service guards the repository layer against null lists,
     * skipping the database call entirely.
     */
    @Test
    void addLabelsToVendorDoesNotCallRepositoryWhenListIsNull() {
        UUID vendorId = UUID.randomUUID();

        service.addLabelsToVendor(vendorId, null);

        // Verify that the repository was completely ignored
        verifyNoInteractions(repo);
    }

    /**
     * Verifies that the service guards the repository layer against empty lists,
     * skipping the database call entirely.
     */
    @Test
    void addLabelsToVendorDoesNotCallRepositoryWhenListIsEmpty() {
        UUID vendorId = UUID.randomUUID();

        service.addLabelsToVendor(vendorId, Collections.emptyList());

        // Verify that the repository was completely ignored
        verifyNoInteractions(repo);
    }

    /**
     * Verifies that the service correctly delegates the removal of a specific
     * label association to the repository.
     */
    @Test
    void removeLabelFromVendorCallsRepository() {
        UUID vendorId = UUID.randomUUID();
        Long labelId = 5L;

        service.removeLabelFromVendor(vendorId, labelId);

        verify(repo).deleteVendorLabel(vendorId, labelId);
    }
}