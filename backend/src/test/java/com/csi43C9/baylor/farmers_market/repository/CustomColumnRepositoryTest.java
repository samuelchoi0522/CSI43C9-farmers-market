package com.csi43C9.baylor.farmers_market.repository;

import com.csi43C9.baylor.farmers_market.dto.custom_column.CustomColumnMetadata;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.jdbc.test.autoconfigure.JdbcTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Persistence layer tests for {@link CustomColumnRepository}.
 * Uses an in-memory database to verify SQL execution for custom columns.
 */
@JdbcTest
@Import(CustomColumnRepository.class)
class CustomColumnRepositoryTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private CustomColumnRepository customColumnRepository;

    /**
     * Set up the custom_columns table schema before each test.
     */
    @BeforeEach
    void setUp() {
        jdbcTemplate.execute("TRUNCATE TABLE custom_columns");
    }

    /**
     * Verifies that a new custom column is correctly persisted and an ID is generated.
     */
    @Test
    void savePersistsNewColumnWithGeneratedId() {
        CustomColumnMetadata newColumn = new CustomColumnMetadata(null, "Booth Dimension", "text", true);
        CustomColumnMetadata saved = customColumnRepository.save(newColumn);

        assertThat(saved.id()).isNotNull();

        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM custom_columns WHERE name = 'Booth Dimension'", Integer.class);
        assertThat(count).isEqualTo(1);
    }

    /**
     * Verifies that an existing column entity is correctly updated.
     */
    @Test
    void saveUpdatesExistingColumn() {
        CustomColumnMetadata initialColumn = new CustomColumnMetadata(null, "Temp Col", "text", false);
        CustomColumnMetadata saved = customColumnRepository.save(initialColumn);
        Long id = saved.id();

        CustomColumnMetadata updatedColumn = new CustomColumnMetadata(id, "Updated Col", "number", true);
        customColumnRepository.save(updatedColumn);

        Optional<CustomColumnMetadata> result = customColumnRepository.findById(id);
        assertThat(result).isPresent();
        assertThat(result.get().name()).isEqualTo("Updated Col");
        assertThat(result.get().type()).isEqualTo("number");
        assertThat(result.get().isRequired()).isTrue();
    }

    /**
     * Verifies that findAllPaged() returns the correct page offset and limits.
     */
    @Test
    void findAllPagedReturnsCorrectSlice() {
        for (int i = 1; i <= 3; i++) {
            customColumnRepository.save(new CustomColumnMetadata(null, "Col " + i, "text", false));
        }

        List<CustomColumnMetadata> page0 = customColumnRepository.findAllPaged(0, 2);
        assertThat(page0).hasSize(2);

        List<CustomColumnMetadata> page1 = customColumnRepository.findAllPaged(1, 2);
        assertThat(page1).hasSize(1);
    }

    /**
     * Verifies that findAllActiveColumns() excludes columns where deactivated_at is not null.
     */
    @Test
    void findAllActiveColumnsExcludesDeactivated() {
        CustomColumnMetadata c1 = customColumnRepository.save(new CustomColumnMetadata(null, "Active Col", "text", false));
        CustomColumnMetadata c2 = customColumnRepository.save(new CustomColumnMetadata(null, "Inactive Col", "text", false));

        customColumnRepository.deactivate(c2.id());

        List<CustomColumnMetadata> activeColumns = customColumnRepository.findAllActiveColumns();

        assertThat(activeColumns).hasSize(1);
        assertThat(activeColumns.getFirst().name()).isEqualTo("Active Col");
    }

    /**
     * Verifies that deactivating and then reactivating a column toggles its active status correctly.
     */
    @Test
    void deactivateAndReactivateTogglesStatus() {
        CustomColumnMetadata column = customColumnRepository.save(new CustomColumnMetadata(null, "Toggle Col", "text", false));
        Long id = column.id();

        customColumnRepository.deactivate(id);
        assertThat(customColumnRepository.findAllActiveColumns()).isEmpty();

        customColumnRepository.reactivate(id);
        assertThat(customColumnRepository.findAllActiveColumns()).hasSize(1);
    }

    /**
     * Verifies that deleteById() completely removes the specified column from the database.
     */
    @Test
    void deleteByIdRemovesColumn() {
        CustomColumnMetadata saved = customColumnRepository.save(new CustomColumnMetadata(null, "Delete Me", "text", false));
        Long id = saved.id();

        customColumnRepository.deleteById(id);

        List<CustomColumnMetadata> all = customColumnRepository.findAll();
        assertThat(all).isEmpty();
        assertThat(customColumnRepository.count()).isEqualTo(0L);
    }
}
