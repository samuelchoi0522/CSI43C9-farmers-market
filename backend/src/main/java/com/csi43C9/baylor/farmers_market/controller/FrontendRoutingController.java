package com.csi43C9.baylor.farmers_market.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class FrontendRoutingController {

    // Catches Next.js <Link> data payloads.
    @RequestMapping("/vendor/{uuid:[a-fA-F0-9\\-]+}.txt")
    public String vendorProfileData() {
        return "forward:/vendor/template.txt";
    }

    // Catches the direct browser refresh for the HTML page.
    @RequestMapping("/vendor/{uuid:[a-fA-F0-9\\-]+}")
    public String vendorProfileHtml() {
        return "forward:/vendor/template.html";
    }

    @RequestMapping(value = {
            "/",
            "/login",
            "/dashboard",
            "/vendors",
            "/admin"
    })
    public String redirect(HttpServletRequest request) {
        String uri = request.getRequestURI();

        // The root route should always serve the main index
        if (uri.equals("/") || uri.equals("")) {
            return "forward:/index.html";
        }

        // Safety check to prevent infinite .html.html loops
        if (uri.endsWith(".html")) {
            return "forward:" + uri;
        }

        // Forward to the static Next.js HTML file
        return "forward:" + uri + ".html";
    }
}