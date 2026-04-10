"use client";

import { useEffect, useState } from "react";
import { Command } from "@tauri-apps/plugin-shell";

// We now accept 'children' so this can wrap your entire application
export default function SidecarBooter({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      
      // If we are in standard browser dev mode (localhost:3000), skip the sidecar and unlock UI immediately
      // if (!('__TAURI_INTERNALS__' in window)) {
      //   setIsReady(true);
      //   return;
      // }

      const startBackend = async () => {
        console.log("🚀 Starting Spring Boot sidecar...");
        try {
          if (!('__TAURI_INTERNALS__' in window)) {
            console.warn("⚠️ Not running in Tauri environment. Skipping sidecar boot.");
            setIsReady(true);
            return;
          }
          const command = Command.sidecar('binaries/spring-backend');
          await command.spawn();
          console.log('✅ Spring Boot process spawned!');

          // --- THE WAITING ROOM ---
          // Ping the backend every 500ms until it responds
          const pollBackend = async () => {
            try {
              // We ping a known endpoint to see if Tomcat is listening yet
              const res = await fetch('http://127.0.0.1:8080/api/custom-columns/active');
              if (res.ok) {
                console.log("🎉 Backend is awake! Unlocking UI.");
                setIsReady(true);
              } else {
                setTimeout(pollBackend, 500);
              }
            } catch (e) {
              // If it fails to fetch, port 8080 is still closed. Try again in half a second.
              setTimeout(pollBackend, 500);
            }
          };

          pollBackend();

        } catch (error) {
          console.error('❌ Failed to boot Spring Boot sidecar:', error);
        }
      };

      startBackend();
    }
  }, []);

  // While Java is booting, trap the user on this loading screen
  if (!isReady) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', fontFamily: 'sans-serif' }}>
        <h2 style={{ color: '#333' }}>☕ Waking up MarketOS...</h2>
        <p style={{ color: '#666' }}>Starting local database sidecar</p>
      </div>
    );
  }

  // Once Java is awake, render the actual React application!
  return <>{children}</>;
}