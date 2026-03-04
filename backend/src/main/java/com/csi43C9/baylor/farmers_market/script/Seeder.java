package com.csi43C9.baylor.farmers_market.script;

import com.csi43C9.baylor.farmers_market.FarmersMarketApplication;
import com.csi43C9.baylor.farmers_market.entity.User;
import com.csi43C9.baylor.farmers_market.entity.Vendor;
import com.csi43C9.baylor.farmers_market.entity.VendorTransaction;
import com.csi43C9.baylor.farmers_market.repository.UserRepository;
import com.csi43C9.baylor.farmers_market.repository.VendorRepository;
import com.csi43C9.baylor.farmers_market.repository.VendorTransactionRepository;
import io.github.cdimascio.dotenv.Dotenv;
import net.datafaker.Faker;
import org.springframework.boot.SpringApplication;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
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
    private static final int VENDOR_COUNT = 20;

    static void main(String[] args) {
        // Load environment variables from .env file
        Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
        dotenv.entries().forEach(e -> System.setProperty(e.getKey(), e.getValue()));

        // Start Spring Web Application
        SpringApplication app = new SpringApplication(FarmersMarketApplication.class);
        app.setDefaultProperties(Collections.singletonMap("server.port", "0"));

        try (ConfigurableApplicationContext context = app.run(args)) {
            // Retrieve the repositories
            VendorRepository vendorRepository = context.getBean(VendorRepository.class);
            UserRepository userRepository = context.getBean(UserRepository.class);
            VendorTransactionRepository transactionRepository = context.getBean(VendorTransactionRepository.class);

            // Comment out the seeds you don't want to run
            Seeder seeder = new Seeder();
            // seeder.populateVendors(vendorRepository);
            //seeder.populateUser(userRepository);
            seeder.populateVendorTransactions(vendorRepository, transactionRepository);
        } catch (Exception e) {
            e.printStackTrace();
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
            v.setIsFarmer(faker.bool().bool());
            v.setIsProduce(faker.bool().bool());
            v.setWomanOwned(faker.bool().bool());
            v.setBipocOwned(faker.bool().bool());
            v.setVeteranOwned(faker.bool().bool());

            v.setIsActive(true);
            vendorRepository.save(v);
        }
        System.out.println("Done seeding vendors!");
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
     * Seeds the database with vendor transactions.
     */
    private void populateVendorTransactions(VendorRepository vendorRepository, VendorTransactionRepository transactionRepository) {
        List<Vendor> allVendors = vendorRepository.findAll();
        List<java.time.LocalDate> marketDates = List.of(
            java.time.LocalDate.now().minusWeeks(1),
            java.time.LocalDate.now().minusWeeks(2),
            java.time.LocalDate.now().minusWeeks(3),
            java.time.LocalDate.now().minusWeeks(4),
            java.time.LocalDate.now().minusWeeks(5)
        );

        System.out.println("Seeding transactions for " + allVendors.size() + " vendors...");
        java.util.ArrayList<VendorTransaction> allTransactions = new java.util.ArrayList<>();

        for (Vendor vendor : allVendors) {
            for (java.time.LocalDate date : marketDates) {
                // Not all vendors attend every market
                if (faker.number().numberBetween(1, 10) > 8) {
                    continue;
                }

                VendorTransaction transaction = new VendorTransaction();
                transaction.setVendorId(vendor.getId());
                transaction.setVendorName(vendor.getVendorName());
                transaction.setMarketDate(date);
                transaction.setPresent(faker.bool().bool());

                if (transaction.isPresent()) {
                    transaction.setSnap(faker.number().randomDouble(2, 0, 100));
                    transaction.setDufb(faker.number().randomDouble(2, 0, 100));
                    transaction.setWdfmTokens(faker.number().randomDouble(2, 0, 100));
                    transaction.setVoucher(faker.number().randomDouble(2, 0, 100));
                    transaction.setReportedSales(faker.number().randomDouble(2, 100, 1000));
                    transaction.setEstProduceSales(faker.number().randomDouble(2, 50, 500));
                    transaction.setEstNumTransactions((long) faker.number().numberBetween(5, 50));
                    
                    // Simple reimbursement calculation example
                    transaction.setReimbursementDue(
                        transaction.getSnap() + 
                        transaction.getDufb() + 
                        transaction.getWdfmTokens() + 
                        transaction.getVoucher()
                    );
                } else {
                    transaction.setSnap(0.0);
                    transaction.setDufb(0.0);
                    transaction.setWdfmTokens(0.0);
                    transaction.setVoucher(0.0);
                    transaction.setReimbursementDue(0.0);
                    transaction.setReportedSales(0.0);
                    transaction.setEstProduceSales(0.0);
                    transaction.setEstNumTransactions(0L);
                }
                allTransactions.add(transaction);
            }
        }
        
        transactionRepository.saveAll(allTransactions);
        System.out.println("Done seeding transactions! (" + allTransactions.size() + " records)");
    }


}
