package com.csi43C9.baylor.farmers_market.controller;

import com.csi43C9.baylor.farmers_market.dto.vendor.CategoryLabelDto;
import com.csi43C9.baylor.farmers_market.security.SecurityConfig;
import com.csi43C9.baylor.farmers_market.security.UserDetailsServiceImpl;
import com.csi43C9.baylor.farmers_market.security.jwt.AuthEntryPointJwt;
import com.csi43C9.baylor.farmers_market.security.jwt.JwtAuthFilter;
import com.csi43C9.baylor.farmers_market.security.jwt.JwtUtil;
import com.csi43C9.baylor.farmers_market.service.VendorCategoryService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

import java.util.List;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration tests for {@link GlobalLabelController}.
 * Verifies that the system-wide category labels can be managed correctly.
 */
@WebMvcTest(GlobalLabelController.class)
@Import({SecurityConfig.class, AuthEntryPointJwt.class, JwtAuthFilter.class})
class GlobalLabelControllerTest {

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
     * Verifies that an authenticated user can create a new global category label.
     * @throws Exception if mock MVC request fails.
     */
    @Test
    @WithMockUser
    void createCategoryLabelReturnsCreated() throws Exception {
        CategoryLabelDto requestDto = new CategoryLabelDto(null, "New Label");
        CategoryLabelDto savedDto = new CategoryLabelDto(1L, "New Label");

        when(service.createCategoryLabel("New Label")).thenReturn(savedDto);

        mockMvc.perform(post("/api/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("New Label"));
    }

    /**
     * Verifies that an authenticated user can retrieve all available system labels.
     * @throws Exception if mock MVC request fails.
     */
    @Test
    @WithMockUser
    void getAllLabelsReturnsOk() throws Exception {
        List<CategoryLabelDto> mockLabels = List.of(
                new CategoryLabelDto(1L, "Produce"),
                new CategoryLabelDto(2L, "Bakery")
        );

        when(service.getAllAvailableLabels()).thenReturn(mockLabels);

        mockMvc.perform(get("/api/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].name").value("Produce"))
                .andExpect(jsonPath("$[1].name").value("Bakery"));
    }

    /**
     * Verifies that an authenticated user can delete a global category label.
     * @throws Exception if mock MVC request fails.
     */
    @Test
    @WithMockUser
    void deleteLabelReturnsNoContent() throws Exception {
        mockMvc.perform(delete("/api/categories/{labelId}", 1L))
                .andExpect(status().isNoContent());

        verify(service).deleteCategoryLabel(1L);
    }
}
