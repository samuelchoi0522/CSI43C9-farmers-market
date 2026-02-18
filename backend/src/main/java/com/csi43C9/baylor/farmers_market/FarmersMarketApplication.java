package com.csi43C9.baylor.farmers_market;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

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

    /**
     * Main entry point. Loads .env variables into system properties
     * so application.properties can resolve ${VARIABLE_NAME}.
     */
	public static void main(String[] args) {
        Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
        dotenv.entries().forEach(e -> System.setProperty(e.getKey(), e.getValue()));

		SpringApplication.run(FarmersMarketApplication.class, args);
	}

}
