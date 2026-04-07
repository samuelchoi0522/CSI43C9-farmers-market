package com.csi43C9.baylor.farmers_market.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class FrontendRoutingController {

    @RequestMapping("/vendor/{uuid}")
    public String vendorProfile() {
        return "forward:/vendor/template.html";
    }

    // Catch all routes that aren't API calls or static assets (like .css or .js)
    @RequestMapping(value = {
            "/{path:[^\\.]*}",
            "/{path:[^\\.]*}/**"
    })
    public String redirect(HttpServletRequest request) {
        String uri = request.getRequestURI();

        // The root route should always serve the main index
        if (uri.equals("/") || uri.isEmpty()) {
            return "forward:/index.html";
        }

        // Next.js static exports create physical .html files for every route
        // So hitting /dashboard needs to forward to /dashboard.html
        return "forward:" + uri + ".html";
    }
}