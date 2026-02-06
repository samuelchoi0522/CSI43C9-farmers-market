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

/**
 * Unit tests for the {@link VendorCategoryRepository}.
 * <p>
 * This class uses Mockito to verify the behavior of the repository methods in isolation.
 * It ensures that the correct SQL queries are constructed, parameters (especially UUIDs)
 * are mapped correctly to database types, and guard clauses function as expected.
 */
@ExtendWith(MockitoExtension.class)
class VendorCategoryRepositoryTest {

    @Mock
    private JdbcTemplate jdbc;

    @InjectMocks
    private VendorCategoryRepository repository;

    // --- Tests for INSERT ---

    /**
     * Verifies that {@code insertVendorLabels} triggers a batch update when provided with a valid list of labels.
     * <p>
     * This test checks the high-level flow: ensuring the {@code batchUpdate} method on the JdbcTemplate
     * is called with the correct SQL string and the provided list of data.
     */
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

    /**
     * Verifies the internal logic of the batch update lambda.
     * <p>
     * Since the actual parameter setting happens inside a callback (Lambda), this test
     * captures that callback and manually executes it against a mock {@link PreparedStatement}.
     * This ensures that the UUID is correctly converted to bytes and the label ID is set
     * at the correct parameter index.
     *
     * @throws SQLException if the PreparedStatement interaction fails (mocked)
     */
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

    /**
     * Verifies that the insert method aborts immediately if the label list is null.
     * Ensures no database connection is attempted.
     */
    @Test
    void insertVendorLabels_shouldDoNothing_whenListIsNull() {
        // Act
        repository.insertVendorLabels(UUID.randomUUID(), null);

        // Assert
        verifyNoInteractions(jdbc);
    }

    /**
     * Verifies that the insert method aborts immediately if the label list is empty.
     * Ensures no unnecessary SQL queries are executed.
     */
    @Test
    void insertVendorLabels_shouldDoNothing_whenListIsEmpty() {
        // Act
        repository.insertVendorLabels(UUID.randomUUID(), Collections.emptyList());

        // Assert
        verifyNoInteractions(jdbc);
    }

    // --- Tests for SEARCH (Find) ---

    /**
     * Verifies that {@code findLabelIdsByVendor} executes the correct SELECT query.
     * <p>
     * It ensures that the UUID is converted to the expected byte array before being
     * passed to the JDBC template, and that the result list is returned correctly.
     */
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

    /**
     * Verifies that {@code deleteVendorLabel} executes the correct DELETE statement.
     * <p>
     * It checks that the SQL contains the delete clause and that the correct
     * binary UUID and label ID are passed as parameters.
     */
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

    /**
     * Verifies the correctness of the {@code uuidToBytes} helper method.
     * <p>
     * This test explicitly checks that the conversion results in a 16-byte array,
     * which is critical for matching the {@code BINARY(16)} column type in the database.
     */
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