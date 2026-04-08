package com.csi43C9.baylor.farmers_market.controller;

import org.springframework.boot.SpringApplication;
import org.springframework.context.ApplicationContext;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

@RestController
public class SystemController {

    private final ApplicationContext context;

    public SystemController(ApplicationContext context) {
        this.context = context;
    }

    @PostMapping("/api/system/shutdown")
    public void shutdown() {
        // Run shutdown in a background thread so the HTTP request can finish first
        Executors.newSingleThreadScheduledExecutor().schedule(() -> {
            SpringApplication.exit(context, () -> 0);
            System.exit(0);
        }, 500, TimeUnit.MILLISECONDS);
    }
}
