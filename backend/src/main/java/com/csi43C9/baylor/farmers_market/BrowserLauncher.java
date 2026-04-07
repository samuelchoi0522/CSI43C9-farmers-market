package com.csi43C9.baylor.farmers_market;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class BrowserLauncher {

    @EventListener(ApplicationReadyEvent.class)
    public void launchBrowser() {
        try {
            String os = System.getProperty("os.name").toLowerCase();
            String url = "http://localhost:8080";

            // Safely execute the native OS command to open the default browser
            if (os.contains("win")) {
                Runtime.getRuntime().exec("rundll32 url.dll,FileProtocolHandler " + url);
            } else if (os.contains("mac")) {
                Runtime.getRuntime().exec("open " + url);
            }
        } catch (Exception e) {
            System.out.println("Failed to auto-launch browser.");
        }
    }
}
