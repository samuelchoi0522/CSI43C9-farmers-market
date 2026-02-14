package com.csi43C9.baylor.farmers_market.service;

import com.csi43C9.baylor.farmers_market.dto.PagedResponse;
import com.csi43C9.baylor.farmers_market.dto.vendor.SaveVendorRequest;
import com.csi43C9.baylor.farmers_market.entity.Vendor;
import com.csi43C9.baylor.farmers_market.repository.VendorRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link VendorService}.
 * Focuses on business logic and DTO-to-Entity mapping.
 */
@ExtendWith(MockitoExtension.class)
class VendorServiceTest {

    @Mock
    private VendorRepository vendorRepository;

    @InjectMocks
    private VendorService vendorService;

    /**
     * Verifies that the service correctly maps DTO fields to a new Vendor entity
     * and calls the repository's save method.
     */
    @Test
    void createVendorMapsAndSavesSuccessfully() {
        SaveVendorRequest request = new SaveVendorRequest();
        request.setVendorName("Mclane Stadium Market");
        request.setPointPerson("Judge Baylor");
        request.setEmail("judge@baylor.edu");

        when(vendorRepository.save(any(Vendor.class))).thenAnswer(i -> i.getArguments()[0]);

        Vendor result = vendorService.create(request);

        assertThat(result.getVendorName()).isEqualTo(request.getVendorName());
        assertThat(result.getPointPerson()).isEqualTo(request.getPointPerson());
        verify(vendorRepository).save(any(Vendor.class));
    }

    @Test
    void getVendorsCalculatesPagingCorrectly() {
        // Arrange
        when(vendorRepository.findAllPaged(0, 10)).thenReturn(List.of(new Vendor()));
        when(vendorRepository.count()).thenReturn(15L);

        // Act
        PagedResponse<Vendor> result = vendorService.getVendors(0, 10);

        // Assert
        assertThat(result.getTotalElements()).isEqualTo(15L);
        assertThat(result.getTotalPages()).isEqualTo(2); // 15 items / size 10 = 2 pages
        assertThat(result.getData()).hasSize(1);
    }

    @Test
    void getVendorByIdCallsRepository() {
        UUID id = UUID.randomUUID();
        vendorService.get(id);
        verify(vendorRepository).findById(id);
    }
}
