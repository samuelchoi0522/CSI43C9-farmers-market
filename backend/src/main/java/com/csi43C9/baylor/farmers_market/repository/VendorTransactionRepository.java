package com.csi43C9.baylor.farmers_market.repository;

import com.csi43C9.baylor.farmers_market.dto.vendor_transaction.VendorTransactionFilterRequest;
import com.csi43C9.baylor.farmers_market.dto.vendor_transaction.RevenueBreakdown;
import com.csi43C9.baylor.farmers_market.entity.VendorTransaction;
import com.csi43C9.baylor.farmers_market.repository.base.AbstractJdbcRepository;
import com.csi43C9.baylor.farmers_market.repository.base.MarketRepository;
import com.csi43C9.baylor.farmers_market.repository.mapper.VendorTransactionRowMapper;
import com.csi43C9.baylor.farmers_market.util.UuidUtils;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

import java.sql.ResultSet;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.ArrayList;

/**
 * JDBC implementation of VendorTransaction management.
 * Extends {@link AbstractJdbcRepository} for binary UUID mapping.
 */
@Repository
public class VendorTransactionRepository extends AbstractJdbcRepository implements MarketRepository<VendorTransaction, UUID> {

    private final ObjectMapper objectMapper;

    protected VendorTransactionRepository(JdbcTemplate jdbcTemplate, ObjectMapper objectMapper) {
        super(jdbcTemplate);
        this.objectMapper = objectMapper;
    }

    /**
     * Persists a new vendor transaction to the database.
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
                    est_produce_sales, est_num_transactions, custom_data
                )
                values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            ps.setString(14, toJsonString(transaction.getCustomData()));
        });

        return transactions;
    }

    /**
     * Inserts a new vendor transaction record into the database.
     */
    private VendorTransaction insert(VendorTransaction transaction) {
        String sql = """
                insert into vendor_transactions (
                    id, vendor_id, vendor_name, market_date, present, snap, dufb,
                    wdfm_tokens, voucher, reimbursement_due, reported_sales,
                    est_produce_sales, est_num_transactions, custom_data
                )
                values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                transaction.getEstNumTransactions(),
                toJsonString(transaction.getCustomData())
        );

        return transaction;
    }

    /**
     * Updates an existing vendor transaction record.
     */
    public int update(VendorTransaction transaction) {
        String sql = """
                update vendor_transactions
                set vendor_id = ?, vendor_name = ?, market_date = ?, present = ?,
                    snap = ?, dufb = ?, wdfm_tokens = ?, voucher = ?,
                    reimbursement_due = ?, reported_sales = ?, est_produce_sales = ?,
                    est_num_transactions = ?, custom_data = ?
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
                toJsonString(transaction.getCustomData()),
                UuidUtils.toBytes(transaction.getId())
        );
    }

    /**
     * Retrieves a vendor transaction by its UUID from the database.
     */
    @Override
    public Optional<VendorTransaction> findById(UUID uuid) {
        String sql = "select * from vendor_transactions where id = ?";
        try {
            VendorTransaction transaction = jdbcTemplate.queryForObject(
                    sql,
                    new VendorTransactionRowMapper(objectMapper),
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
        return jdbcTemplate.query(sql, new VendorTransactionRowMapper(objectMapper));
    }

    /**
     * Retrieves a page of vendor transactions from the database.
     */
    @Override
    public List<VendorTransaction> findAllPaged(int page, int size) {
        int offset = page * size;
        String sql = """
                select * from vendor_transactions
                order by market_date desc, vendor_name
                offset ? rows fetch next ? rows only
                """;
        return jdbcTemplate.query(sql, new VendorTransactionRowMapper(objectMapper), offset, size);
    }

    /**
     * Retrieves all distinct market dates ordered from most recent to oldest.
     *
     * @return a list of unique market dates
     */
    public List<LocalDate> findAllMarketDates() {
        String sql = """
                select distinct market_date
                from vendor_transactions
                order by market_date desc
                """;
        return jdbcTemplate.queryForList(sql, LocalDate.class);
    }

    /**
     * Retrieves a page of vendor transactions matching the provided filters.
     * @param filter filter values to apply
     * @param page 0-based page number
     * @param size page size
     * @return a list of matching vendor transactions
     */
    public List<VendorTransaction> findFilteredPaged(VendorTransactionFilterRequest filter, int page, int size) {
        QueryParts query = buildFilteredQuery(filter, false, null);
        query.sql.append("""
                order by market_date desc, vendor_name
                offset ? rows fetch next ? rows only
                """);
        query.args.add(page * size);
        query.args.add(size);
        return jdbcTemplate.query(query.sql.toString(), new VendorTransactionRowMapper(objectMapper), query.args.toArray());
    }

    /**
     * Counts vendor transactions matching the provided filters.
     * @param filter filter values to apply
     * @return the number of matching vendor transactions
     */
    public long countFiltered(VendorTransactionFilterRequest filter) {
        QueryParts query = buildFilteredQuery(filter, true, null);
        Long count = jdbcTemplate.queryForObject(query.sql.toString(), Long.class, query.args.toArray());
        return count != null ? count : 0L;
    }

    /**
     * Retrieves a page of vendor transactions for a specific vendor.
     * @param vendorId the vendor UUID
     * @param page 0-based page number
     * @param size page size
     * @return a list of matching vendor transactions
     */
    public List<VendorTransaction> findByVendorIdPaged(UUID vendorId, int page, int size) {
        QueryParts query = buildFilteredQuery(null, false, vendorId);
        query.sql.append("""
                order by market_date desc, vendor_name
                offset ? rows fetch next ? rows only
                """);
        query.args.add(page * size);
        query.args.add(size);
        return jdbcTemplate.query(query.sql.toString(), new VendorTransactionRowMapper(objectMapper), query.args.toArray());
    }

    /**
     * Counts vendor transactions for a specific vendor.
     * @param vendorId the vendor UUID
     * @return the number of matching vendor transactions
     */
    public long countByVendorId(UUID vendorId) {
        QueryParts query = buildFilteredQuery(null, true, vendorId);
        Long count = jdbcTemplate.queryForObject(query.sql.toString(), Long.class, query.args.toArray());
        return count != null ? count : 0L;
    }

    /**
     * Counts the number of vendor transactions in the database.
     */
    @Override
    public Long count() {
        String sql = "select count(*) from vendor_transactions";
        Long count = jdbcTemplate.queryForObject(sql, Long.class);
        return count != null ? count : 0L;
    }

    /**
     * Deletes a vendor transaction from the database.
     */
    @Override
    public void deleteById(UUID uuid) {
        String sql = "delete from vendor_transactions where id = ?";
        jdbcTemplate.update(sql, UuidUtils.toBytes(uuid));
    }

    private QueryParts buildFilteredQuery(VendorTransactionFilterRequest filter, boolean countQuery, UUID vendorId) {
        StringBuilder sql = new StringBuilder(countQuery
                ? "select count(*) from vendor_transactions where 1 = 1"
                : "select * from vendor_transactions where 1 = 1");
        List<Object> args = new ArrayList<>();

        UUID effectiveVendorId = vendorId;
        if (effectiveVendorId == null && filter != null) {
            effectiveVendorId = filter.getVendorId();
        }

        if (effectiveVendorId != null) {
            sql.append(" and vendor_id = ?");
            args.add(UuidUtils.toBytes(effectiveVendorId));
        }

        if (filter != null) {
            if (filter.getMarketDate() != null) {
                sql.append(" and market_date = ?");
                args.add(filter.getMarketDate());
            }

            if (filter.getStartMarketDate() != null && filter.getEndMarketDate() != null) {
                sql.append(" and market_date between ? and ?");
                args.add(filter.getStartMarketDate());
                args.add(filter.getEndMarketDate());
            }
        }

        return new QueryParts(sql, args);
    }

    private record QueryParts(StringBuilder sql, List<Object> args) {
    }

    /**
     * Retrieves the revenue breakdown by vendor type for a single specific market date.
     *
     * @param date the market date to query
     * @return a RevenueBreakdown record containing the rounded revenue totals
     */
    public RevenueBreakdown getRevenueBreakdownForDate(LocalDate date) {
        // Delegate to the range method, using the same date for start and end
        return getRevenueBreakdownForDateRange(date, date);
    }

    /**
     * Retrieves the revenue breakdown by vendor type for a specific date range.
     *
     * @param startDate the beginning of the market date range (inclusive)
     * @param endDate   the end of the market date range (inclusive)
     * @return a RevenueBreakdown record containing the rounded revenue totals
     */
    public RevenueBreakdown getRevenueBreakdownForDateRange(LocalDate startDate, LocalDate endDate) {
        String sql = """
                /* Vendor sales for the specified date range */
                with vendor_sales as (
                    select vendor_id, sum(reported_sales) as reported_sales
                    from vendor_transactions
                    where market_date >= ? and market_date <= ?
                      and present = 1
                    group by vendor_id
                ),
                /* Vendor sales multiplied by their default revenue percentages */
                vendor_revenues as (
                    select vs.vendor_id,
                           vs.reported_sales,
                           vs.reported_sales * coalesce(vd.pct_handmade / 100.0, 0)      as handmade_revenue,
                           vs.reported_sales * coalesce(vd.pct_agricultural / 100.0, 0)  as agricultural_revenue,
                           vs.reported_sales * coalesce(vd.pct_prepared_food / 100.0, 0) as prepared_revenue,
                           vs.reported_sales * coalesce(vd.pct_cottage_goods / 100.0, 0) as cottage_revenue,
                           vs.reported_sales * coalesce(vd.pct_manufactured / 100.0, 0)  as manufactured_revenue
                    from vendor_sales vs
                    left join vendor_defaults vd on vd.vendor_id = vs.vendor_id
                )
                /* Sum the revenues by vendor type, converting nulls to zero */
                select
                    coalesce(round(sum(handmade_revenue), 2), 0)     as handmade,
                    coalesce(round(sum(agricultural_revenue), 2), 0) as agricultural,
                    coalesce(round(sum(prepared_revenue), 2), 0)     as prepared,
                    coalesce(round(sum(cottage_revenue), 2), 0)      as cottage,
                    coalesce(round(sum(manufactured_revenue), 2), 0) as manufactured,
                    coalesce(round(sum(reported_sales), 2), 0)       as total_sales
                from vendor_revenues
                """;

        return jdbcTemplate.queryForObject(sql, (ResultSet rs, int _) -> new RevenueBreakdown(
                rs.getBigDecimal("handmade"),
                rs.getBigDecimal("agricultural"),
                rs.getBigDecimal("prepared"),
                rs.getBigDecimal("cottage"),
                rs.getBigDecimal("manufactured"),
                rs.getBigDecimal("total_sales")
        ), startDate, endDate);
    }

    /**
     * Helper to safely convert the custom data map into a JSON string.
     */
    private String toJsonString(Map<String, Object> data) {
        if (data == null || data.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(data);
        } catch (JacksonException e) {
            throw new RuntimeException("Failed to serialize custom data payload", e);
        }
    }
}
