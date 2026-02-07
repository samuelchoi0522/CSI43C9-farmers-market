package com.csi43C9.baylor.farmers_market.service;

import com.csi43C9.baylor.farmers_market.dto.vendor.CreateVendorRequest;
import com.csi43C9.baylor.farmers_market.entity.Vendor;
import com.csi43C9.baylor.farmers_market.repository.VendorRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

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
        CreateVendorRequest request = new CreateVendorRequest();
        request.setVendorName("Mclane Stadium Market");
        request.setPointPerson("Judge Baylor");
        request.setEmail("judge@baylor.edu");

        when(vendorRepository.save(any(Vendor.class))).thenAnswer(i -> i.getArguments()[0]);

        Vendor result = vendorService.createVendor(request);

        assertThat(result.getVendorName()).isEqualTo(request.getVendorName());
        assertThat(result.getPointPerson()).isEqualTo(request.getPointPerson());
        verify(vendorRepository).save(any(Vendor.class));
    }
}