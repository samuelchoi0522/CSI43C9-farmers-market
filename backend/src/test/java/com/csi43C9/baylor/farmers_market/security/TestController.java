package com.csi43C9.baylor.farmers_market.security;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/*
 * A simple REST controller used solely for testing Spring Security configurations.
 * It provides a public endpoint and a protected endpoint to verify that access
 * rules defined in `SecurityConfig` are correctly applied by the application.
 */
@RestController
public class TestController {

    /**
     * An endpoint designed to be publicly accessible without any authentication.
     * Used to verify that security configurations permit access to certain paths.
     * @return a simple string indicating public content.
     */
    @GetMapping("/api/auth/public")
    public String publicEndpoint() {
        return "Public content";
    }

    /**
     * An endpoint designed to be protected, requiring authentication to access.
     * Used to verify that security configurations restrict access to certain paths.
     * @return a simple string indicating protected content.
     */
    @GetMapping("/api/protected")
    public String protectedEndpoint() {
        return "Protected content";
    }
}
