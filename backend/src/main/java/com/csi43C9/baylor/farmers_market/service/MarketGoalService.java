package com.csi43C9.baylor.farmers_market.service;

import com.csi43C9.baylor.farmers_market.dto.market_goal.MarketGoal;
import com.csi43C9.baylor.farmers_market.dto.market_goal.MarketGoalProgress;
import com.csi43C9.baylor.farmers_market.repository.MarketGoalRepository;
import com.csi43C9.baylor.farmers_market.repository.VendorTransactionRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Business logic for market goals and progress from vendor transactions.
 */
@Service
public class MarketGoalService {

    private static final Set<String> ALLOWED_METRICS = Set.of(
            "REPORTED_SALES",
            "TOKEN_VOLUME",
            "ACTIVE_VENDOR_ATTENDANCE");

    private final MarketGoalRepository marketGoalRepository;
    private final VendorTransactionRepository vendorTransactionRepository;

    public MarketGoalService(
            MarketGoalRepository marketGoalRepository,
            VendorTransactionRepository vendorTransactionRepository) {
        this.marketGoalRepository = marketGoalRepository;
        this.vendorTransactionRepository = vendorTransactionRepository;
    }

    /**
     * Lists all goals with current progress.
     */
    public List<MarketGoalProgress> listGoalsWithProgress() {
        return marketGoalRepository.findAll().stream()
                .map(this::toProgress)
                .collect(Collectors.toList());
    }

    /**
     * Creates a goal after validation.
     */
    public MarketGoal createGoal(MarketGoal input) {
        validateGoal(input);
        MarketGoal toSave = new MarketGoal(
                null,
                input.name().trim(),
                input.startDate(),
                input.endDate(),
                input.metric().trim().toUpperCase(Locale.ROOT),
                input.targetValue());
        return marketGoalRepository.save(toSave);
    }

    /**
     * Updates an existing goal.
     */
    public MarketGoal updateGoal(long id, MarketGoal input) {
        validateGoal(input);
        MarketGoal toSave = new MarketGoal(
                id,
                input.name().trim(),
                input.startDate(),
                input.endDate(),
                input.metric().trim().toUpperCase(Locale.ROOT),
                input.targetValue());
        return marketGoalRepository.save(toSave);
    }

    public void deleteGoal(long id) {
        marketGoalRepository.deleteById(id);
    }

    private void validateGoal(MarketGoal input) {
        if (input.name() == null || input.name().isBlank()) {
            throw new IllegalArgumentException("Goal name is required.");
        }
        if (input.startDate() == null || input.endDate() == null) {
            throw new IllegalArgumentException("Start and end dates are required.");
        }
        if (input.endDate().isBefore(input.startDate())) {
            throw new IllegalArgumentException("End date must be on or after start date.");
        }
        String metric = input.metric() != null ? input.metric().trim().toUpperCase(Locale.ROOT) : "";
        if (!ALLOWED_METRICS.contains(metric)) {
            throw new IllegalArgumentException("Invalid metric: " + input.metric());
        }
        if ("ACTIVE_VENDOR_ATTENDANCE".equals(metric)) {
            if (input.targetValue() <= 0 || input.targetValue() > 100) {
                throw new IllegalArgumentException("Attendance target must be a percentage between 0 and 100.");
            }
        } else if (input.targetValue() <= 0) {
            throw new IllegalArgumentException("Target must be greater than zero.");
        }
    }

    private MarketGoalProgress toProgress(MarketGoal goal) {
        double current = computeCurrent(goal);
        double pct = goal.targetValue() > 0 ? (current / goal.targetValue()) * 100.0 : 0.0;
        return new MarketGoalProgress(
                goal.id(),
                goal.name(),
                goal.startDate(),
                goal.endDate(),
                goal.metric(),
                goal.targetValue(),
                current,
                pct);
    }

    private double computeCurrent(MarketGoal goal) {
        return switch (goal.metric()) {
            case "REPORTED_SALES" -> vendorTransactionRepository.sumReportedSalesBetween(
                    goal.startDate(), goal.endDate());
            case "TOKEN_VOLUME" -> vendorTransactionRepository.sumTokenVolumeBetween(
                    goal.startDate(), goal.endDate());
            case "ACTIVE_VENDOR_ATTENDANCE" -> computeActiveVendorAttendancePercent(goal.startDate(), goal.endDate());
            default -> 0.0;
        };
    }

    /**
     * Percent of active-vendor session rows that are present (0–100).
     */
    private double computeActiveVendorAttendancePercent(LocalDate start, LocalDate end) {
        long total = vendorTransactionRepository.countActiveVendorSessionsBetween(start, end);
        if (total <= 0) {
            return 0.0;
        }
        long present = vendorTransactionRepository.countActiveVendorAttendanceBetween(start, end);
        return (present * 100.0) / total;
    }
}
