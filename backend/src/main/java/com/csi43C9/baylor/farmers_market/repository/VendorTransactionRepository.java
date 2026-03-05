package com.csi43C9.baylor.farmers_market.repository;

import com.csi43C9.baylor.farmers_market.entity.VendorTransaction;
import com.csi43C9.baylor.farmers_market.repository.base.AbstractJdbcRepository;
import com.csi43C9.baylor.farmers_market.repository.base.MarketRepository;
import com.csi43C9.baylor.farmers_market.repository.mapper.VendorTransactionRowMapper;
import com.csi43C9.baylor.farmers_market.util.UuidUtils;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * JDBC implementation of VendorTransaction management.
 * Extends {@link AbstractJdbcRepository} for binary UUID mapping.
 */
@Repository
public class VendorTransactionRepository extends AbstractJdbcRepository implements MarketRepository<VendorTransaction, UUID> {

    protected VendorTransactionRepository(JdbcTemplate jdbcTemplate) {
        super(jdbcTemplate);
    }

    /**
     * Persists a new vendor transaction to the database.
     * Generates a random {@link UUID} and converts it to a 16-byte array for
     * storage in a BINARY(16) column.
     */
    @Override
    public VendorTransaction save(VendorTransaction transaction) {
        if (transaction.getId() == null) {
            transaction.setId(UUID.randomUUID());
            return insert(transaction);
        } else {
            int result = update(transaction);
            if (result == 0) {
                throw new IllegalStateException("Failed to update vendor transaction record.");
            }
            return transaction;
        }
    }

    /**
     * Persists multiple vendor transactions to the database.
     * @param transactions the vendor transactions to insert
     * @return the inserted vendor transactions
     */
    public List<VendorTransaction> saveAll(List<VendorTransaction> transactions) {
        if (transactions.isEmpty()) {
            return transactions;
        }

        transactions.forEach(transaction -> {
            if (transaction.getId() == null) {
                transaction.setId(UUID.randomUUID());
            }
        });

        String sql = """
                insert into vendor_transactions (
                    id, vendor_id, vendor_name, market_date, present, snap, dufb,
                    wdfm_tokens, voucher, reimbursement_due, reported_sales,
                    est_produce_sales, est_num_transactions
                )
                values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """;

        jdbcTemplate.batchUpdate(sql, transactions, transactions.size(), (ps, transaction) -> {
            ps.setBytes(1, UuidUtils.toBytes(transaction.getId()));
            ps.setBytes(2, UuidUtils.toBytes(transaction.getVendorId()));
            ps.setString(3, transaction.getVendorName());
            ps.setObject(4, transaction.getMarketDate());
            ps.setBoolean(5, transaction.isPresent());
            ps.setObject(6, transaction.getSnap());
            ps.setObject(7, transaction.getDufb());
            ps.setObject(8, transaction.getWdfmTokens());
            ps.setObject(9, transaction.getVoucher());
            ps.setObject(10, transaction.getReimbursementDue());
            ps.setObject(11, transaction.getReportedSales());
            ps.setObject(12, transaction.getEstProduceSales());
            ps.setObject(13, transaction.getEstNumTransactions());
        });

        return transactions;
    }

    /**
     * Inserts a new vendor transaction record into the database.
     * @param transaction the vendor transaction to insert
     * @return the inserted vendor transaction
     */
    private VendorTransaction insert(VendorTransaction transaction) {
        String sql = """
                insert into vendor_transactions (
                    id, vendor_id, vendor_name, market_date, present, snap, dufb,
                    wdfm_tokens, voucher, reimbursement_due, reported_sales,
                    est_produce_sales, est_num_transactions
                )
                values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """;

        jdbcTemplate.update(sql,
                UuidUtils.toBytes(transaction.getId()),
                UuidUtils.toBytes(transaction.getVendorId()),
                transaction.getVendorName(),
                transaction.getMarketDate(),
                transaction.isPresent(),
                transaction.getSnap(),
                transaction.getDufb(),
                transaction.getWdfmTokens(),
                transaction.getVoucher(),
                transaction.getReimbursementDue(),
                transaction.getReportedSales(),
                transaction.getEstProduceSales(),
                transaction.getEstNumTransactions()
        );

        return transaction;
    }

    /**
     * Updates an existing vendor transaction record.
     * @return the number of rows affected (should be 1 if successful).
     */
    public int update(VendorTransaction transaction) {
        String sql = """
                update vendor_transactions
                set vendor_id = ?, vendor_name = ?, market_date = ?, present = ?,
                    snap = ?, dufb = ?, wdfm_tokens = ?, voucher = ?,
                    reimbursement_due = ?, reported_sales = ?, est_produce_sales = ?,
                    est_num_transactions = ?
                where id = ?
                """;

        return jdbcTemplate.update(sql,
                UuidUtils.toBytes(transaction.getVendorId()),
                transaction.getVendorName(),
                transaction.getMarketDate(),
                transaction.isPresent(),
                transaction.getSnap(),
                transaction.getDufb(),
                transaction.getWdfmTokens(),
                transaction.getVoucher(),
                transaction.getReimbursementDue(),
                transaction.getReportedSales(),
                transaction.getEstProduceSales(),
                transaction.getEstNumTransactions(),
                UuidUtils.toBytes(transaction.getId())
        );
    }

    /**
     * Retrieves a vendor transaction by its UUID from the database.
     * @param uuid The UUID of the transaction to retrieve.
     */
    @Override
    public Optional<VendorTransaction> findById(UUID uuid) {
        String sql = "select * from vendor_transactions where id = ?";
        try {
            VendorTransaction transaction = jdbcTemplate.queryForObject(
                    sql,
                    new VendorTransactionRowMapper(),
                    UuidUtils.toBytes(uuid)
            );
            return Optional.ofNullable(transaction);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    /**
     * Retrieves all vendor transactions from the database.
     */
    @Override
    public List<VendorTransaction> findAll() {
        String sql = "select * from vendor_transactions";
        return jdbcTemplate.query(sql, new VendorTransactionRowMapper());
    }

    /**
     * Retrieves a page of vendor transactions from the database.
     * @param page 0-based page number
     * @param size page size
     * @return a List of vendor transactions
     */
    @Override
    public List<VendorTransaction> findAllPaged(int page, int size) {
        int offset = page * size;
        String sql = """
                select * from vendor_transactions
                order by market_date desc, vendor_name
                offset ? rows fetch next ? rows only
                """;
        return jdbcTemplate.query(sql, new VendorTransactionRowMapper(), offset, size);
    }

    /**
     * Counts the number of vendor transactions in the database.
     * @return the number of vendor transactions
     */
    @Override
    public Long count() {
        String sql = "select count(*) from vendor_transactions";
        Long count = jdbcTemplate.queryForObject(sql, Long.class);
        return count != null ? count : 0L;
    }

    /**
     * Deletes a vendor transaction from the database.
     * @param uuid The UUID of the transaction to delete.
     */
    @Override
    public void deleteById(UUID uuid) {
        String sql = "delete from vendor_transactions where id = ?";
        jdbcTemplate.update(sql, UuidUtils.toBytes(uuid));
    }
}
