package com.csi43C9.baylor.farmers_market.controller;

import com.csi43C9.baylor.farmers_market.dto.vendor.CreateVendorRequest;
import com.csi43C9.baylor.farmers_market.entity.Vendor;
import com.csi43C9.baylor.farmers_market.security.SecurityConfig;
import com.csi43C9.baylor.farmers_market.security.UserDetailsServiceImpl;
import com.csi43C9.baylor.farmers_market.security.jwt.AuthEntryPointJwt;
import com.csi43C9.baylor.farmers_market.security.jwt.JwtAuthFilter;
import com.csi43C9.baylor.farmers_market.security.jwt.JwtUtil;
import com.csi43C9.baylor.farmers_market.service.VendorService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration tests for {@link VendorController}.
 * Verifies that the endpoint is secured and correctly processes vendor creation requests
 * using {@link MockMvc} to simulate the web layer.
 */
@WebMvcTest(VendorController.class)
@Import({SecurityConfig.class, AuthEntryPointJwt.class, JwtAuthFilter.class})
class VendorControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private VendorService vendorService;

    @MockitoBean
    private UserDetailsServiceImpl userDetailsService;

    @MockitoBean
    private JwtUtil jwtUtil;

    /**
     * Verifies that an authenticated user can successfully create a vendor.
     * Checks for a 201 Created status and the presence of the generated ID.
     *
     * @throws Exception if mock MVC request fails.
     */
    @Test
    @WithMockUser
    void createVendorAuthenticatedReturnsCreated() throws Exception {
        CreateVendorRequest request = new CreateVendorRequest();
        request.setVendorName("Test Vendor");
        request.setEmail("test@example.com");
        request.setPointPerson("John Doe");

        Vendor savedVendor = new Vendor();
        savedVendor.setId(UUID.randomUUID());
        savedVendor.setVendorName(request.getVendorName());

        when(vendorService.createVendor(any(CreateVendorRequest.class))).thenReturn(savedVendor);

        mockMvc.perform(post("/api/vendor")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.vendorName").value("Test Vendor"));
    }

    /**
     * Verifies that the endpoint returns 400 Bad Request when the request body
     * violates validation constraints (e.g., blank name).
     *
     * @throws Exception if mock MVC request fails.
     */
    @Test
    @WithMockUser
    void createVendorInvalidRequestReturnsBadRequest() throws Exception {
        CreateVendorRequest request = new CreateVendorRequest();
        request.setVendorName(""); // Should trigger @NotBlank

        mockMvc.perform(post("/api/vendor")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}