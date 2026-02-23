import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "Market Manager Login | MarketOS",
  description: "MarketOS Market Manager Portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const storedDarkMode = localStorage.getItem("darkMode");
                  if (storedDarkMode === null) {
                    // If no preference, default to light mode and save it
                    document.documentElement.classList.remove("dark");
                    localStorage.setItem("darkMode", "false");
                  } else if (storedDarkMode === "true") {
                    document.documentElement.classList.add("dark");
                  } else {
                    document.documentElement.classList.remove("dark");
                  }
                } catch (e) {
                  console.error("Failed to access localStorage for dark mode:", e);
                  // Fallback to light mode if localStorage is unavailable
                  document.documentElement.classList.remove("dark");
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${fraunces.variable} antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
