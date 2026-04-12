package com.csi43C9.baylor.farmers_market.controller;

import com.csi43C9.baylor.farmers_market.dto.PagedResponse;
import com.csi43C9.baylor.farmers_market.dto.vendor.SaveVendorDefaultsRequest;
import com.csi43C9.baylor.farmers_market.entity.VendorDefaults;
import com.csi43C9.baylor.farmers_market.service.VendorDefaultsService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration tests for {@link VendorDefaultsController}.
 */
@WebMvcTest(VendorDefaultsController.class)
class VendorDefaultsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private VendorDefaultsService vendorDefaultsService;

    @Test
    void createVendorDefaultsAuthenticatedReturnsCreated() throws Exception {
        SaveVendorDefaultsRequest request = new SaveVendorDefaultsRequest();
        request.setVendorId(UUID.randomUUID());
        request.setPctHandmade(new BigDecimal("20.00"));
        request.setPctAgricultural(new BigDecimal("20.00"));
        request.setPctPreparedFood(new BigDecimal("20.00"));
        request.setPctCottageGoods(new BigDecimal("20.00"));
        request.setPctManufactured(new BigDecimal("20.00"));

        VendorDefaults savedDefaults = new VendorDefaults();
        savedDefaults.setId(UUID.randomUUID());
        savedDefaults.setVendorId(request.getVendorId());

        when(vendorDefaultsService.create(any(SaveVendorDefaultsRequest.class))).thenReturn(savedDefaults);

        mockMvc.perform(post("/api/defaults")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists());
    }

    @Test
    void createVendorDefaultsInvalidRequestReturnsBadRequest() throws Exception {
        SaveVendorDefaultsRequest request = new SaveVendorDefaultsRequest();
        // Missing vendorId should trigger @NotNull

        mockMvc.perform(post("/api/defaults")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getVendorDefaultsByIdReturnsOk() throws Exception {
        UUID id = UUID.randomUUID();
        VendorDefaults defaults = new VendorDefaults();
        defaults.setId(id);

        when(vendorDefaultsService.get(id)).thenReturn(Optional.of(defaults));

        mockMvc.perform(get("/api/defaults/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id.toString()));
    }

    @Test
    void getVendorDefaultsByVendorIdReturnsOk() throws Exception {
        UUID vendorId = UUID.randomUUID();
        VendorDefaults defaults = new VendorDefaults();
        defaults.setVendorId(vendorId);

        when(vendorDefaultsService.getByVendorId(vendorId)).thenReturn(Optional.of(defaults));

        mockMvc.perform(get("/api/defaults/vendor/" + vendorId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.vendorId").value(vendorId.toString()));
    }

    @Test
    void getAllVendorDefaultsReturnsPagedResponse() throws Exception {
        PagedResponse<VendorDefaults> response = new PagedResponse<>(
                Collections.emptyList(), 0, 10, 0L, 0);

        when(vendorDefaultsService.getVendorDefaults(0, 10)).thenReturn(response);

        mockMvc.perform(get("/api/defaults?page=0&size=10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    void updateVendorDefaultsReturnsOk() throws Exception {
        UUID id = UUID.randomUUID();
        SaveVendorDefaultsRequest request = new SaveVendorDefaultsRequest();
        request.setVendorId(UUID.randomUUID());
        request.setPctHandmade(new BigDecimal("100.00"));

        VendorDefaults updatedDefaults = new VendorDefaults();
        updatedDefaults.setId(id);
        updatedDefaults.setVendorId(request.getVendorId());

        when(vendorDefaultsService.update(any(UUID.class), any(SaveVendorDefaultsRequest.class))).thenReturn(updatedDefaults);

        mockMvc.perform(patch("/api/defaults/" + id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id.toString()));
    }

    @Test
    void deleteVendorDefaultsReturnsNoContent() throws Exception {
        UUID id = UUID.randomUUID();

        mockMvc.perform(delete("/api/defaults/" + id))
                .andExpect(status().isNoContent());

        verify(vendorDefaultsService).delete(id);
    }
}
