package com.csi43C9.baylor.farmers_market.service;

import com.csi43C9.baylor.farmers_market.entity.MarketDayData;
import com.csi43C9.baylor.farmers_market.repository.MarketDayDataRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Optional;

@Service
public class MarketDayDataService {

    private final MarketDayDataRepository repository;

    public MarketDayDataService(MarketDayDataRepository repository) {
        this.repository = repository;
    }

    public MarketDayData save(MarketDayData data) {
        return repository.save(data);
    }

    public Optional<MarketDayData> findByMarketDate(LocalDate date) {
        return repository.findByMarketDate(date);
    }
}
