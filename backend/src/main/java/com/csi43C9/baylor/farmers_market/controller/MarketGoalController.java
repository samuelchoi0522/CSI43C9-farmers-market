package com.csi43C9.baylor.farmers_market.controller;

import com.csi43C9.baylor.farmers_market.dto.market_goal.MarketGoal;
import com.csi43C9.baylor.farmers_market.dto.market_goal.MarketGoalProgress;
import com.csi43C9.baylor.farmers_market.service.MarketGoalService;
import org.springframework.aot.hint.annotation.RegisterReflectionForBinding;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REST API for market goals and progress.
 */
@CrossOrigin(origins = {"*"})
@RestController
@RequestMapping("/api/market-goals")
@RegisterReflectionForBinding({MarketGoal.class, MarketGoalProgress.class})
public class MarketGoalController {

    private final MarketGoalService marketGoalService;

    public MarketGoalController(MarketGoalService marketGoalService) {
        this.marketGoalService = marketGoalService;
    }

    /**
     * All goals with actuals and percent toward target.
     */
    @GetMapping
    public ResponseEntity<List<MarketGoalProgress>> listWithProgress() {
        return ResponseEntity.ok(marketGoalService.listGoalsWithProgress());
    }

    @PostMapping
    public ResponseEntity<MarketGoal> create(@RequestBody MarketGoal body) {
        try {
            MarketGoal created = marketGoalService.createGoal(body);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<MarketGoal> update(@PathVariable long id, @RequestBody MarketGoal body) {
        try {
            return ResponseEntity.ok(marketGoalService.updateGoal(id, body));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable long id) {
        marketGoalService.deleteGoal(id);
        return ResponseEntity.noContent().build();
    }
}
