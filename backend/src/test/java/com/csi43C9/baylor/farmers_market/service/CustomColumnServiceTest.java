package com.csi43C9.baylor.farmers_market.service;

import com.csi43C9.baylor.farmers_market.dto.PagedResponse;
import com.csi43C9.baylor.farmers_market.dto.custom_column.CustomColumnMetadata;
import com.csi43C9.baylor.farmers_market.repository.CustomColumnRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link CustomColumnService}.
 * Focuses on business logic, validation, and interaction with the repository.
 */
@ExtendWith(MockitoExtension.class)
class CustomColumnServiceTest {

    @Mock
    private CustomColumnRepository customColumnRepository;

    @InjectMocks
    private CustomColumnService customColumnService;

    /**
     * Verifies that the service successfully saves a valid custom column.
     */
    @Test
    void createColumnSavesSuccessfully() {
        CustomColumnMetadata request = new CustomColumnMetadata(null, "Requires Power", "text", false);

        when(customColumnRepository.save(any(CustomColumnMetadata.class))).thenAnswer(i -> i.getArguments()[0]);

        CustomColumnMetadata result = customColumnService.createColumn(request);

        assertThat(result.name()).isEqualTo(request.name());
        assertThat(result.type()).isEqualTo("text");
        verify(customColumnRepository).save(any(CustomColumnMetadata.class));
    }

    /**
     * Verifies that the service successfully saves valid boolean and usd custom columns.
     */
    @Test
    void createColumnSavesNewTypesSuccessfully() {
        CustomColumnMetadata booleanRequest = new CustomColumnMetadata(null, "Requires Electricity", "boolean", false);
        CustomColumnMetadata usdRequest = new CustomColumnMetadata(null, "Stall Fee", "usd", false);

        when(customColumnRepository.save(any(CustomColumnMetadata.class))).thenAnswer(i -> i.getArguments()[0]);

        CustomColumnMetadata booleanResult = customColumnService.createColumn(booleanRequest);
        assertThat(booleanResult.type()).isEqualTo("boolean");

        CustomColumnMetadata usdResult = customColumnService.createColumn(usdRequest);
        assertThat(usdResult.type()).isEqualTo("usd");
    }

    /**
     * Verifies that the service throws an exception when attempting to create a column with an invalid type.
     */
    @Test
    void createColumnWithInvalidTypeThrowsException() {
        CustomColumnMetadata request = new CustomColumnMetadata(null, "Invalid Type Column", "date", false);

        assertThatThrownBy(() -> customColumnService.createColumn(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("type must be");
    }

    /**
     * Verifies that updating a column throws an exception if the column is not found in the database.
     */
    @Test
    void updateColumnThrowsExceptionWhenNotFound() {
        Long id = 1L;
        CustomColumnMetadata request = new CustomColumnMetadata(id, "Requires Power", "text", false);

        when(customColumnRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> customColumnService.updateColumn(id, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Custom column not found");
    }

    /**
     * Verifies that the service calculates the correct page size and total number of pages.
     */
    @Test
    void getPagedColumnsCalculatesPagingCorrectly() {
        when(customColumnRepository.findAllPaged(0, 10)).thenReturn(List.of(
                new CustomColumnMetadata(1L, "Col 1", "text", false)
        ));
        when(customColumnRepository.count()).thenReturn(15L);

        PagedResponse<CustomColumnMetadata> result = customColumnService.getPagedColumns(0, 10);

        assertThat(result.getTotalElements()).isEqualTo(15L);
        assertThat(result.getTotalPages()).isEqualTo(2);
        assertThat(result.getData()).hasSize(1);
    }

    /**
     * Verifies that the service calls the repository's deactivate method.
     */
    @Test
    void deactivateColumnCallsRepository() {
        Long id = 1L;
        customColumnService.deactivateColumn(id);
        verify(customColumnRepository).deactivate(id);
    }

    /**
     * Verifies that the service calls the repository's reactivate method.
     */
    @Test
    void reactivateColumnCallsRepository() {
        Long id = 1L;
        customColumnService.reactivateColumn(id);
        verify(customColumnRepository).reactivate(id);
    }
}
