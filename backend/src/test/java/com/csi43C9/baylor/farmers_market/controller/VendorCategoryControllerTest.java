package com.csi43C9.baylor.farmers_market.controller;

import com.csi43C9.baylor.farmers_market.dto.vendor.CategoryLabelDto;
import com.csi43C9.baylor.farmers_market.dto.vendor.VendorLabelRequest;
import com.csi43C9.baylor.farmers_market.security.SecurityConfig;
import com.csi43C9.baylor.farmers_market.security.UserDetailsServiceImpl;
import com.csi43C9.baylor.farmers_market.security.jwt.AuthEntryPointJwt;
import com.csi43C9.baylor.farmers_market.security.jwt.JwtAuthFilter;
import com.csi43C9.baylor.farmers_market.security.jwt.JwtUtil;
import com.csi43C9.baylor.farmers_market.service.VendorCategoryService;
import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration tests for {@link VendorLabelController}.
 * Verifies that the endpoint is secured and correctly processes requests
 * to retrieve, add, and remove vendor category labels.
 */
@WebMvcTest({VendorLabelController.class}) // <--- ADD BOTH HERE
@Import({SecurityConfig.class, AuthEntryPointJwt.class, JwtAuthFilter.class})
class VendorCategoryControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private VendorCategoryService service;

    @MockitoBean
    private UserDetailsServiceImpl userDetailsService;

    @MockitoBean
    private JwtUtil jwtUtil;

    /**
     * Verifies that an authenticated user can retrieve a vendor's categories.
     *
     * @throws Exception if mock MVC request fails.
     */
    @Test
    @WithMockUser
    void getVendorCategoriesReturnsOkWithList() throws Exception {
        UUID vendorId = UUID.randomUUID();
        List<CategoryLabelDto> mockCategories = List.of(
                new CategoryLabelDto(1L, "Produce"),
                new CategoryLabelDto(4L, "Organic")
        );

        when(service.getLabelsForVendor(vendorId)).thenReturn(mockCategories);

        mockMvc.perform(get("/api/vendors/" + vendorId + "/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].name").value("Produce"))
                .andExpect(jsonPath("$[1].id").value(4))
                .andExpect(jsonPath("$[1].name").value("Organic"));
    }

    /**
     * Verifies that an authenticated user can add categories to a vendor.
     *
     * @throws Exception if mock MVC request fails.
     */
    @Test
    @WithMockUser
    void addCategoriesReturnsCreated() throws Exception {
        UUID vendorId = UUID.randomUUID();
        VendorLabelRequest request = new VendorLabelRequest();
        request.setLabelIds(List.of(1L, 2L, 3L));

        mockMvc.perform(post("/api/vendors/" + vendorId + "/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        // Verify the service was actually called with the correct parameters
        verify(service).addLabelsToVendor(vendorId, request.getLabelIds());
    }

    /**
     * Verifies that the endpoint returns 400 Bad Request when the request body
     * violates validation constraints (e.g., an empty list of label IDs).
     *
     * @throws Exception if mock MVC request fails.
     */
    @Test
    @WithMockUser
    void addCategoriesInvalidRequestReturnsBadRequest() throws Exception {
        UUID vendorId = UUID.randomUUID();
        VendorLabelRequest request = new VendorLabelRequest();
        request.setLabelIds(Collections.emptyList()); // Triggers @NotEmpty

        mockMvc.perform(post("/api/vendors/" + vendorId + "/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    /**
     * Verifies that the endpoint returns 400 Bad Request when the list
     * contains null values.
     *
     * @throws Exception if mock MVC request fails.
     */
    @Test
    @WithMockUser
    void addCategoriesWithNullIdReturnsBadRequest() throws Exception {
        UUID vendorId = UUID.randomUUID();
        VendorLabelRequest request = new VendorLabelRequest();
        request.setLabelIds(java.util.Arrays.asList(1L, null, 3L)); // Triggers @NotNull on list elements

        mockMvc.perform(post("/api/vendors/" + vendorId + "/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    /**
     * Verifies that the delete endpoint triggers the service's removal method
     * and returns a 204 No Content.
     *
     * @throws Exception if mock MVC request fails.
     */
    @Test
    @WithMockUser
    void removeCategoryReturnsNoContent() throws Exception {
        UUID vendorId = UUID.randomUUID();
        Long labelId = 5L;

        mockMvc.perform(delete("/api/vendors/" + vendorId + "/categories/" + labelId))
                .andExpect(status().isNoContent());

        // Verify the service was triggered
        verify(service).removeLabelFromVendor(vendorId, labelId);
    }

}
