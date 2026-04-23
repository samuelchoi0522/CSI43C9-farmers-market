package com.csi43C9.baylor.farmers_market.controller;

import com.csi43C9.baylor.farmers_market.entity.MarketDayData;
import com.csi43C9.baylor.farmers_market.service.MarketDayDataService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@CrossOrigin(origins = {"*"})
@RestController
@RequestMapping("/api/market-day-data")
public class MarketDayDataController {

    private final MarketDayDataService service;

    public MarketDayDataController(MarketDayDataService service) {
        this.service = service;
    }

    @GetMapping("/{date}")
    public ResponseEntity<MarketDayData> getByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return service.findByMarketDate(date)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.ok(new MarketDayData())); // Return empty data if not found
    }

    @PostMapping
    public ResponseEntity<MarketDayData> save(@RequestBody MarketDayData data) {
        return ResponseEntity.ok(service.save(data));
    }
}
