package com.csi43C9.baylor.farmers_market.controller;

import org.springframework.boot.SpringApplication;
import org.springframework.context.ApplicationContext;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class SystemController {

    private final ApplicationContext context;

    public SystemController(ApplicationContext context) {
        this.context = context;
    }

    @PostMapping("/api/system/shutdown")
    public void shutdown() {
        // Tells Spring Boot to gracefully terminate the server
        SpringApplication.exit(context, () -> 0);
        System.exit(0);
    }
}
