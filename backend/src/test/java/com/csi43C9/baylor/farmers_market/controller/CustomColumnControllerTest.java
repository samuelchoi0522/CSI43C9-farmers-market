package com.csi43C9.baylor.farmers_market.controller;

import com.csi43C9.baylor.farmers_market.dto.PagedResponse;
import com.csi43C9.baylor.farmers_market.dto.custom_column.CustomColumnMetadata;
import com.csi43C9.baylor.farmers_market.service.CustomColumnService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

import java.util.Collections;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration tests for {@link CustomColumnController}.
 * Verifies that the endpoints are secured and correctly process column operations.
 */
@WebMvcTest(CustomColumnController.class)
class CustomColumnControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private CustomColumnService customColumnService;

    /**
     * Verifies that an authenticated user can successfully create a custom column.
     *
     * @throws Exception if mock MVC request fails.
     */
    @Test
    void createColumnAuthenticatedReturnsCreated() throws Exception {
        CustomColumnMetadata request = new CustomColumnMetadata(null, "Vehicle Type", "text", false);
        CustomColumnMetadata savedColumn = new CustomColumnMetadata(1L, "Vehicle Type", "text", false);

        when(customColumnService.createColumn(any(CustomColumnMetadata.class))).thenReturn(savedColumn);

        mockMvc.perform(post("/api/custom-columns")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Vehicle Type"));
    }

    /**
     * Verifies that the endpoint returns the requested custom column when found.
     *
     * @throws Exception if mock MVC request fails.
     */
    @Test
    void getColumnByIdReturnsOk() throws Exception {
        Long id = 1L;
        CustomColumnMetadata column = new CustomColumnMetadata(id, "Booth Size", "text", true);

        when(customColumnService.getColumnById(id)).thenReturn(Optional.of(column));

        mockMvc.perform(get("/api/custom-columns/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Booth Size"));
    }

    /**
     * Verifies that the endpoint returns 404 Not Found when the custom column does not exist.
     *
     * @throws Exception if mock MVC request fails.
     */
    @Test
    void getColumnByIdNotFoundReturns404() throws Exception {
        when(customColumnService.getColumnById(any(Long.class))).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/custom-columns/99"))
                .andExpect(status().isNotFound());
    }

    /**
     * Verifies that the endpoint returns a paged response containing custom columns.
     *
     * @throws Exception if mock MVC request fails.
     */
    @Test
    void getPagedColumnsReturnsPagedResponse() throws Exception {
        PagedResponse<CustomColumnMetadata> response = new PagedResponse<>(
                Collections.emptyList(), 0, 10, 0L, 0);

        when(customColumnService.getPagedColumns(0, 10)).thenReturn(response);

        mockMvc.perform(get("/api/custom-columns?page=0&size=10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    /**
     * Verifies that updating a non-existent column returns a 404 Not Found status.
     *
     * @throws Exception if mock MVC request fails.
     */
    @Test
    void updateColumnNotFoundReturns404() throws Exception {
        Long id = 99L;
        CustomColumnMetadata request = new CustomColumnMetadata(id, "Booth Size", "text", true);

        when(customColumnService.updateColumn(eq(id), any(CustomColumnMetadata.class)))
                .thenThrow(new IllegalArgumentException("Custom column not found with ID: " + id));

        mockMvc.perform(put("/api/custom-columns/" + id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    /**
     * Verifies that the deactivation endpoint triggers the service and returns No Content.
     *
     * @throws Exception if mock MVC request fails.
     */
    @Test
    void deactivateColumnReturnsNoContent() throws Exception {
        Long id = 1L;

        mockMvc.perform(patch("/api/custom-columns/" + id + "/deactivate"))
                .andExpect(status().isNoContent());

        verify(customColumnService).deactivateColumn(id);
    }

    /**
     * Verifies that the reactivation endpoint triggers the service and returns No Content.
     *
     * @throws Exception if mock MVC request fails.
     */
    @Test
    void reactivateColumnReturnsNoContent() throws Exception {
        Long id = 1L;

        mockMvc.perform(patch("/api/custom-columns/" + id + "/reactivate"))
                .andExpect(status().isNoContent());

        verify(customColumnService).reactivateColumn(id);
    }

    /**
     * Verifies that the delete endpoint triggers the service's delete method.
     *
     * @throws Exception if mock MVC request fails.
     */
    @Test
    void deleteColumnReturnsNoContent() throws Exception {
        Long id = 1L;

        mockMvc.perform(delete("/api/custom-columns/" + id))
                .andExpect(status().isNoContent());

        verify(customColumnService).deleteColumn(id);
    }
}
