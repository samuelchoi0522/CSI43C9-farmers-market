package com.csi43C9.baylor.farmers_market.controller;

import com.csi43C9.baylor.farmers_market.dto.vendor.CreateVendorRequest;
import com.csi43C9.baylor.farmers_market.entity.Vendor;
import com.csi43C9.baylor.farmers_market.service.VendorService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;
import java.util.Collections;
import java.util.UUID; // Import UUID

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(VendorController.class)
public class VendorControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private VendorService vendorService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void createVendor_shouldReturnCreatedVendor() throws Exception {
        CreateVendorRequest request = new CreateVendorRequest(
                "Test Vendor", "John Doe", "john.doe@example.com", "Test Location", 10,
                Arrays.asList("Product A", "Product B"), true, true, false, false, false
        );

        UUID vendorId = UUID.randomUUID(); // Generate UUID
        Vendor mockVendor = new Vendor(vendorId, // Use UUID
                "Test Vendor", "John Doe", "john.doe@example.com", "Test Location", 10,
                Arrays.asList("Product A", "Product B"), true, true, false, false, false
        );

        when(vendorService.createVendor(any(CreateVendorRequest.class))).thenReturn(mockVendor);

        mockMvc.perform(post("/api/vendor")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(mockVendor.getId().toString())) // Assert UUID as string
                .andExpect(jsonPath("$.vendorName").value("Test Vendor"))
                .andExpect(jsonPath("$.email").value("john.doe@example.com"));
    }

    @Test
    void createVendor_shouldHandleEmptyProducts() throws Exception {
        CreateVendorRequest request = new CreateVendorRequest(
                "Another Vendor", "Jane Smith", "jane.smith@example.com", "Another Location", 5,
                Collections.emptyList(), false, false, true, true, true
        );

        UUID vendorId = UUID.randomUUID(); // Generate UUID
        Vendor mockVendor = new Vendor(vendorId, // Use UUID
                "Another Vendor", "Jane Smith", "jane.smith@example.com", "Another Location", 5,
                Collections.emptyList(), false, false, true, true, true
        );

        when(vendorService.createVendor(any(CreateVendorRequest.class))).thenReturn(mockVendor);

        mockMvc.perform(post("/api/vendor")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(mockVendor.getId().toString())) // Assert UUID as string
                .andExpect(jsonPath("$.vendorName").value("Another Vendor"))
                .andExpect(jsonPath("$.email").value("jane.smith@example.com"));
    }
}
