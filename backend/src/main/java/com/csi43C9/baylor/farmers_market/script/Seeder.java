package com.csi43C9.baylor.farmers_market.script;

import com.csi43C9.baylor.farmers_market.FarmersMarketApplication;
import com.csi43C9.baylor.farmers_market.entity.User;
import com.csi43C9.baylor.farmers_market.entity.Vendor;
import com.csi43C9.baylor.farmers_market.repository.UserRepository;
import com.csi43C9.baylor.farmers_market.repository.VendorRepository;
import io.github.cdimascio.dotenv.Dotenv;
import net.datafaker.Faker;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.WebApplicationType;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

/**
 * Seeds the database with test data.
 * Note: There are several tables being seeded here. Comment
 * out the ones you don't want to seed.
 */
public class Seeder {
    private final Faker faker = new Faker();
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
    // Change this number to change the number of vendors seeded
    private final int VENDOR_COUNT = 20;

    static void main(String[] args) {
        // Load environment variables from .env file
        Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
        dotenv.entries().forEach(e -> System.setProperty(e.getKey(), e.getValue()));

        // Start Spring Web Application
        SpringApplication app = new SpringApplication(FarmersMarketApplication.class);
        app.setDefaultProperties(Collections.singletonMap("server.port", "0"));
        ConfigurableApplicationContext context = app.run(args);

        try {
            // Retrieve the repositories
            VendorRepository vendorRepository = context.getBean(VendorRepository.class);
            UserRepository userRepository = context.getBean(UserRepository.class);

            // Comment out the seeds you don't want to run
            Seeder seeder = new Seeder();
            seeder.populateVendors(vendorRepository);
            //seeder.populateUser(userRepository);
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            // Close the context when done
            context.close();
        }
    }

    /**
     * Seeds the database with vendor test data.
     */
    private void populateVendors(VendorRepository vendorRepository) {
        // Store vendor names to avoid duplicates
        Map<String, String> vendorNames = new HashMap<>();

        System.out.println("Seeding " + VENDOR_COUNT + " vendors...");
        for (int i = 0; i < VENDOR_COUNT; i++) {
            Vendor v = new Vendor();

            // Generate unique vendor names
            String suffix = (i < VENDOR_COUNT / 2) ? " Farms" : " Shop";
            String name = faker.food().dish() + suffix;
            while (vendorNames.containsKey(name)) {
                name = faker.food().dish() + suffix;
            }
            vendorNames.put(name, name);
            v.setVendorName(name);

            // Generate random products
            StringBuilder products = new StringBuilder();
            for (int j = 0; j < faker.number().numberBetween(1, 5); j++) {
                if (!products.isEmpty()) {
                    products.append(", ");
                }
                products.append(faker.food().dish());
            }
            v.setProducts(products.toString());

            // Generate random vendor attributes
            v.setPointPerson(faker.name().fullName());
            v.setEmail(faker.internet().emailAddress());
            v.setLocation(faker.address().fullAddress());
            v.setMiles(faker.number().randomDigit());
            v.setFarmer(faker.bool().bool());
            v.setProduce(faker.bool().bool());
            v.setWomanOwned(faker.bool().bool());
            v.setBipocOwned(faker.bool().bool());
            v.setVeteranOwned(faker.bool().bool());

            v.setActive(true);
            vendorRepository.save(v);
        }
        System.out.println("Done seeding!");
    }

    /**
     * Seeds the database with user test data.
     */
    private void populateUser(UserRepository userRepository) {
        User u = new User();
        u.setEmail("test@test.com");
        u.setPasswordHash(encoder.encode("password"));
        userRepository.save(u);
    }

    /**
     * TODO: Seeds the database with category labels.
     */
    void populateCategoryLabels() {
        // Nothing here yet
    }

    /**
     * TODO: Seeds the database with vendor transactions.
     */
    void populateVendorTransactions() {
        // Nothing here yet
    }


}
