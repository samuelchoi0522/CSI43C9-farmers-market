// app/components/SidecarBooter.tsx
"use client";

import { useEffect } from "react";
import { Command } from "@tauri-apps/plugin-shell";

export default function SidecarBooter() {
  useEffect(() => {
    // 1. Ensure we are in the browser, not the Next.js build server
    if (typeof window !== "undefined") {
      
      // In development, we assume Spring Boot is already running in the IDE, so we skip booting the sidecar.
      if (process.env.NODE_ENV === 'development') {
        console.log("🛠️ Dev Mode: Bypassing sidecar. Assuming Spring Boot is running in IDE.");
        return;
      }

      // 2. Safely check if we are running inside the Tauri native window
      if ('__TAURI_INTERNALS__' in window) {
        const startBackend = async () => {
          try {
            const command = Command.sidecar('binaries/spring-backend');
            const child = await command.spawn();
            console.log('Spring Boot Sidecar Started with PID:', child.pid);
          } catch (error) {
            console.error('Failed to boot Spring Boot sidecar:', error);
          }
        };

        startBackend();
      }
    }
  }, []);

  return null; // This component is completely invisible
}
