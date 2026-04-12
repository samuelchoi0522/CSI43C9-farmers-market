package com.csi43C9.baylor.farmers_market;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.File;

/**
 * Main entry point for the Farmers Market Spring Boot application.
 *
 * <p>This class bootstraps and launches the Spring Boot application.
 * It uses the {@code @SpringBootApplication} annotation, which is a convenience
 * annotation that adds:
 * <ul>
 *   <li>{@code @Configuration}: Tags the class as a source of bean definitions for the application context.</li>
 *   <li>{@code @EnableAutoConfiguration}: Tells Spring Boot to start adding beans based on classpath settings,
 *       other beans, and various property settings.</li>
 *   <li>{@code @ComponentScan}: Tells Spring to look for other components, configurations, and services
 *       in the 'com.csi43C9.baylor.farmers_market' package, allowing it to find and register controllers,
 *       services, and repositories.</li>
 * </ul>
 */
@SpringBootApplication
public class FarmersMarketApplication {

    public static void main(String[] args) {
        setupApplicationDataDirectory();
        SpringApplication.run(FarmersMarketApplication.class, args);
    }

    public static void setupApplicationDataDirectory() {
        String os = System.getProperty("os.name").toLowerCase();
        String userHome = System.getProperty("user.home");
        File appDir;

        if (os.contains("win")) {
            appDir = new File(System.getenv("LOCALAPPDATA"), "MarketOS");
        } else if (os.contains("mac")) {
            appDir = new File(userHome, "Library/Application Support/MarketOS");
        } else {
            appDir = new File(userHome, ".marketos");
        }

        if (!appDir.exists()) {
            appDir.mkdirs();
        }

        // This injects a global variable into Spring Boot before it starts
        System.setProperty("app.data.dir", appDir.getAbsolutePath());
    }
}
