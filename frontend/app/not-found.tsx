"use client";

import DarkModeToggle from "./components/DarkModeToggle";

export default function NotFound() {
  return (
    <div className="bg-[#F9FAF2] dark:bg-[#121412] font-sans transition-colors duration-300">
      <DarkModeToggle />
      
      <div className="min-h-screen flex items-center justify-center market-bg p-4">
        <div className="w-full max-w-md">
          <div className="glass-panel dark:border dark:border-white/10 p-8 rounded-2xl shadow-2xl text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              404 Not Found
            </h1>
          </div>
        </div>
      </div>
    </div>
  );
}

