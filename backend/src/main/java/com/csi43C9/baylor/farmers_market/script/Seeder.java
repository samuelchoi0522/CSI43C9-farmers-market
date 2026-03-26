package com.csi43C9.baylor.farmers_market.script;

import com.csi43C9.baylor.farmers_market.FarmersMarketApplication;
import com.csi43C9.baylor.farmers_market.dto.custom_column.CustomColumnMetadata;
import com.csi43C9.baylor.farmers_market.dto.vendor.CategoryLabelDto;
import com.csi43C9.baylor.farmers_market.entity.User;
import com.csi43C9.baylor.farmers_market.entity.Vendor;
import com.csi43C9.baylor.farmers_market.entity.VendorTransaction;
import com.csi43C9.baylor.farmers_market.entity.VendorDefaults;
import com.csi43C9.baylor.farmers_market.repository.CustomColumnRepository;
import com.csi43C9.baylor.farmers_market.repository.UserRepository;
import com.csi43C9.baylor.farmers_market.repository.VendorCategoryRepository;
import com.csi43C9.baylor.farmers_market.repository.VendorDefaultsRepository;
import com.csi43C9.baylor.farmers_market.repository.VendorRepository;
import com.csi43C9.baylor.farmers_market.repository.VendorTransactionRepository;
import io.github.cdimascio.dotenv.Dotenv;
import net.datafaker.Faker;
import org.springframework.boot.SpringApplication;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.IntStream;

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
        populateEntites(args);
    }

    private static void populateEntites(String[] args) {
        // Start Spring Web Application
        SpringApplication app = new SpringApplication(FarmersMarketApplication.class);
        app.setDefaultProperties(Collections.singletonMap("server.port", "0"));

        try (ConfigurableApplicationContext context = app.run(args)) {
            // Retrieve the repositories
            VendorRepository vendorRepository = context.getBean(VendorRepository.class);
            UserRepository userRepository = context.getBean(UserRepository.class);
            VendorTransactionRepository transactionRepository = context.getBean(VendorTransactionRepository.class);
            VendorDefaultsRepository vendorDefaultsRepository = context.getBean(VendorDefaultsRepository.class);
            CustomColumnRepository customColumnRepository = context.getBean(CustomColumnRepository.class);
            VendorCategoryRepository vendorCategoryRepository = context.getBean(VendorCategoryRepository.class);

            // Comment out the seeds you don't want to run
            Seeder seeder = new Seeder();
            seeder.populateUser(userRepository);
            seeder.populateVendors(vendorRepository);
            seeder.populateCategoryLabels(vendorCategoryRepository, vendorRepository);
            seeder.populateCustomColumns(customColumnRepository);
            seeder.populateVendorDefaults(vendorRepository, vendorDefaultsRepository);
            seeder.populateVendorTransactions(vendorRepository, transactionRepository, customColumnRepository);
        } catch (Exception _) {
            // Catch the silent exit exception
        }
    }

    /**
     * Seeds the database with custom column definitions.
     */
    private void populateCustomColumns(CustomColumnRepository customColumnRepository) {
        System.out.println("Seeding custom columns...");

        // Only seed if the table is empty to avoid unique constraint violations
        if (customColumnRepository.count() == 0) {
            customColumnRepository.save(new CustomColumnMetadata(null, "Booth Size", "text", true));
            customColumnRepository.save(new CustomColumnMetadata(null, "Vehicle License Plate", "text", false));
            customColumnRepository.save(new CustomColumnMetadata(null, "Distance Traveled (Miles)", "number", true));
            customColumnRepository.save(new CustomColumnMetadata(null, "Number of Tables", "number", false));
        }

        System.out.println("Done seeding custom columns!");
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
     * Seeds the database with default product category percentages for vendors.
     */
    private void populateVendorDefaults(VendorRepository vendorRepository, VendorDefaultsRepository defaultsRepository) {
        List<Vendor> allVendors = vendorRepository.findAll();
        System.out.println("Seeding defaults for " + allVendors.size() + " vendors...");

        for (Vendor vendor : allVendors) {
            // Check if defaults already exist to avoid unique constraint violations
            if (defaultsRepository.findByVendorId(vendor.getId()).isPresent()) {
                continue;
            }

            // Generate 5 random numbers that sum to 100
            int[] parts = new int[5];
            int remaining = 100;
            for (int i = 0; i < 4; i++) {
                parts[i] = faker.number().numberBetween(0, remaining);
                remaining -= parts[i];
            }
            parts[4] = remaining;

            // Shuffle them slightly for more randomness
            ArrayList<Integer> shuffledParts = new ArrayList<>();
            for (int p : parts) {
                shuffledParts.add(p);
            }
            Collections.shuffle(shuffledParts);

            VendorDefaults defaults = VendorDefaults.builder()
                    .vendorId(vendor.getId())
                    .pctHandmade(new BigDecimal(shuffledParts.get(0)).setScale(2, RoundingMode.HALF_UP))
                    .pctAgricultural(new BigDecimal(shuffledParts.get(1)).setScale(2, RoundingMode.HALF_UP))
                    .pctPreparedFood(new BigDecimal(shuffledParts.get(2)).setScale(2, RoundingMode.HALF_UP))
                    .pctCottageGoods(new BigDecimal(shuffledParts.get(3)).setScale(2, RoundingMode.HALF_UP))
                    .pctManufactured(new BigDecimal(shuffledParts.get(4)).setScale(2, RoundingMode.HALF_UP))
                    .build();

            defaultsRepository.save(defaults);
        }
        System.out.println("Done seeding vendor defaults!");
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
     * Seeds the database with category labels and associates them with vendors.
     */
    private void populateCategoryLabels(VendorCategoryRepository categoryRepository, VendorRepository vendorRepository) {
        System.out.println("Seeding category labels...");

        List<CategoryLabelDto> existingLabels = categoryRepository.findAllLabels();
        List<CategoryLabelDto> seedLabels = new ArrayList<>();

        // Create core labels if they don't exist
        if (existingLabels.isEmpty()) {
            seedLabels.add(categoryRepository.createLabel("Organic", "#4CAF50"));
            seedLabels.add(categoryRepository.createLabel("Gluten-Free", "#FFC107"));
            seedLabels.add(categoryRepository.createLabel("Vegan", "#8BC34A"));
            seedLabels.add(categoryRepository.createLabel("Locally Sourced", "#03A9F4"));
            seedLabels.add(categoryRepository.createLabel("Handmade", "#9C27B0"));
            seedLabels.add(categoryRepository.createLabel("Women-Owned", "#E91E63"));
            seedLabels.add(categoryRepository.createLabel("Veteran-Owned", "#3F51B5"));
        } else {
            seedLabels.addAll(existingLabels);
        }

        // Randomly assign 1 to 3 labels to existing vendors
        List<Vendor> allVendors = vendorRepository.findAll();
        for (Vendor vendor : allVendors) {
            int numLabels = faker.number().numberBetween(1, 4);
            List<Long> assignedLabelIds = new ArrayList<>();

            // Shuffle the available labels to pick random ones
            Collections.shuffle(seedLabels);

            for (int i = 0; i < numLabels; i++) {
                assignedLabelIds.add(seedLabels.get(i).getId());
            }

            categoryRepository.insertVendorLabels(vendor.getId(), assignedLabelIds);
        }

        System.out.println("Done seeding category labels!");
    }

    /**
     * Seeds the database with vendor transactions.
     */
    private void populateVendorTransactions(
            VendorRepository vendorRepository,
            VendorTransactionRepository transactionRepository,
            CustomColumnRepository customColumnRepository) {

        List<Vendor> allVendors = vendorRepository.findAll();
        List<CustomColumnMetadata> activeColumns = customColumnRepository.findAllActiveColumns();

        LocalDate mostRecentSaturday = LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.SATURDAY));
        List<LocalDate> marketDates = IntStream.range(0, 52)
                .mapToObj(mostRecentSaturday::minusWeeks)
                .toList();

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

                    // Generate dynamic JSON data based on active columns
                    Map<String, Object> customData = new HashMap<>();
                    for (CustomColumnMetadata column : activeColumns) {
                        String keyId = String.valueOf(column.id());

                        // Randomly skip some non-required fields to simulate real data
                        if (!column.isRequired() && faker.bool().bool()) {
                            continue;
                        }

                        if ("number".equals(column.type())) {
                            customData.put(keyId, faker.number().numberBetween(1, 50));
                        } else {
                            if (column.name().toLowerCase().contains("size")) {
                                customData.put(keyId, faker.options().option("10x10", "10x20", "Standard"));
                            } else if (column.name().toLowerCase().contains("plate")) {
                                customData.put(keyId, faker.bothify("???-####").toUpperCase());
                            } else {
                                customData.put(keyId, faker.lorem().word());
                            }
                        }
                    }
                    transaction.setCustomData(customData);

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
                    transaction.setCustomData(Collections.emptyMap());
                }
                allTransactions.add(transaction);
            }
        }

        transactionRepository.saveAll(allTransactions);
        System.out.println("Done seeding transactions! (" + allTransactions.size() + " records)");
    }

}
