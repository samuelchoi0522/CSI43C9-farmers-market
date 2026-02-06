package com.csi43C9.baylor.farmers_market.VendorTests;

import com.csi43C9.baylor.farmers_market.repository.VendorCategoryRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.ParameterizedPreparedStatementSetter;

import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VendorCategoryRepositoryTest {

    @Mock
    private JdbcTemplate jdbc;

    @InjectMocks
    private VendorCategoryRepository repository;

    // --- Tests for INSERT ---

    @Test
    void insertVendorLabels_shouldCallBatchUpdate_whenListIsPopulated() {
        // Arrange
        UUID vendorId = UUID.randomUUID();
        List<Long> labelIds = List.of(1L, 2L, 3L);


        // Act
        repository.insertVendorLabels(vendorId, labelIds);

        // Assert
        verify(jdbc).batchUpdate(
                contains("INSERT IGNORE INTO vendor_category_labels"), // Match SQL loosely
                eq(labelIds),                                          // Ensure list is passed
                eq(labelIds.size()),                                   // Ensure size matches
                any(ParameterizedPreparedStatementSetter.class)        // Match the lambda
        );
    }
    @Test
    void insertVendorLabels_shouldCallBatchUpdate_andSetCorrectBytes() throws SQLException {
        // Arrange
        UUID vendorId = UUID.randomUUID();
        List<Long> labelIds = List.of(100L, 200L);
        byte[] expectedBytes = repository.uuidToBytes(vendorId);

        // Act
        repository.insertVendorLabels(vendorId, labelIds);

        // Assert
        // 1. Capture the Lambda (ParameterizedPreparedStatementSetter)
        @SuppressWarnings("unchecked")
        ArgumentCaptor<ParameterizedPreparedStatementSetter<Long>> captor =
                ArgumentCaptor.forClass(ParameterizedPreparedStatementSetter.class);

        verify(jdbc).batchUpdate(
                contains("INSERT IGNORE"),
                eq(labelIds),
                eq(labelIds.size()),
                captor.capture() // Capture the actual lambda passed by your code
        );

        // 2. Test the Lambda logic
        // We create a mock PreparedStatement to see what the lambda does to it
        PreparedStatement mockPs = mock(PreparedStatement.class);
        ParameterizedPreparedStatementSetter<Long> capturedLambda = captor.getValue();

        // Run the lambda manually for the first item in the list
        capturedLambda.setValues(mockPs, labelIds.get(0));

        // 3. Verify the lambda set the correct UUID bytes and Label ID
        verify(mockPs).setBytes(1, expectedBytes); // Now expectedBytes is actually used!
        verify(mockPs).setLong(2, 100L);
    }
    @Test
    void insertVendorLabels_shouldDoNothing_whenListIsNull() {
        // Act
        repository.insertVendorLabels(UUID.randomUUID(), null);

        // Assert
        verifyNoInteractions(jdbc);
    }

    @Test
    void insertVendorLabels_shouldDoNothing_whenListIsEmpty() {
        // Act
        repository.insertVendorLabels(UUID.randomUUID(), Collections.emptyList());

        // Assert
        verifyNoInteractions(jdbc);
    }

    // --- Tests for SEARCH (Find) ---

    @Test
    void findLabelIdsByVendor_shouldReturnListOfIds() {
        // Arrange
        UUID vendorId = UUID.randomUUID();
        List<Long> expectedLabels = List.of(10L, 20L);
        byte[] expectedBytes = repository.uuidToBytes(vendorId);

        // Mock the JDBC response
        when(jdbc.queryForList(
                contains("SELECT label_id"),
                eq(Long.class),
                eq(expectedBytes)) // Verify the UUID is converted to bytes correctly here
        ).thenReturn(expectedLabels);

        // Act
        List<Long> actualLabels = repository.findLabelIdsByVendor(vendorId);

        // Assert
        assertEquals(expectedLabels, actualLabels);
        verify(jdbc).queryForList(anyString(), eq(Long.class), eq(expectedBytes));
    }

    // --- Tests for DELETE ---

    @Test
    void deleteVendorLabel_shouldExecuteDeleteSql() {
        // Arrange
        UUID vendorId = UUID.randomUUID();
        long labelId = 55L;
        byte[] expectedBytes = repository.uuidToBytes(vendorId);

        // Act
        repository.deleteVendorLabel(vendorId, labelId);

        // Assert
        verify(jdbc).update(
                contains("DELETE FROM vendor_category_labels"),
                eq(expectedBytes),
                eq(labelId)
        );
    }

    // --- Tests for HELPER (Optional but good for safety) ---

    @Test
    void uuidToBytes_shouldReturnCorrect16ByteArray() {
        // Arrange
        UUID uuid = UUID.fromString("00000000-0000-0000-0000-000000000000");

        // Act
        byte[] bytes = repository.uuidToBytes(uuid);

        // Assert
        assertNotNull(bytes);
        assertEquals(16, bytes.length);
        // For an all-zero UUID, the byte array should be all zeros
        assertArrayEquals(new byte[16], bytes);
    }
}