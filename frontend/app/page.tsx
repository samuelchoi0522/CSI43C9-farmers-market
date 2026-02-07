"use client";

import DarkModeToggle from "./components/DarkModeToggle";
import Button from "./components/Button";

export default function LoginPage() {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Handle form submission here
    console.log("Form submitted");
  };

  return (
    <div className="bg-[#F9FAF2] dark:bg-[#121412] font-sans transition-colors duration-300">
      <DarkModeToggle />
      
      <div className="min-h-screen flex items-center justify-center market-bg p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4 shadow-lg">
              <span className="material-icons text-white text-3xl">local_farm</span>
            </div>
            <h1 className="font-display text-4xl font-bold text-white tracking-tight" style={{ color: '#ffffff' }}>
              Harvest Hub
            </h1>
            <p className="text-white/80 mt-2 font-medium">Market Manager Portal</p>
          </div>

          <div className="glass-panel dark:border dark:border-white/10 p-8 rounded-2xl shadow-2xl">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Welcome back
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                Please enter your credentials to manage your market.
              </p>
            </div>

            <form action="#" className="space-y-5" method="POST" onSubmit={handleSubmit}>
              <div className="space-y-1">
                <label
                  className="block text-sm font-semibold text-gray-700 dark:text-gray-300"
                  htmlFor="email"
                >
                  Market Email
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
                    <span className="material-icons text-[20px]">email</span>
                  </div>
                  <input
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                    id="email"
                    name="email"
                    placeholder="manager@yourmarket.org"
                    required
                    type="email"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label
                    className="block text-sm font-semibold text-gray-700 dark:text-gray-300"
                    htmlFor="password"
                  >
                    Password
                  </label>
                  <a
                    className="text-xs font-semibold text-gray-700 dark:text-primary hover:text-green-700 dark:hover:text-green-400 transition-colors"
                    href="#"
                  >
                    Forgot Password?
                  </a>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
                    <span className="material-icons text-[20px]">lock</span>
                  </div>
                  <input
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                    id="password"
                    name="password"
                    placeholder="••••••••"
                    required
                    type="password"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-900 accent-primary"
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  style={{ accentColor: '#2D5A27' }}
                />
                <label
                  className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                  htmlFor="remember-me"
                >
                  Remember this device
                </label>
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-full flex justify-center shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transform hover:translate-y-[-1px] active:translate-y-[0px] bg-primary hover:bg-green-800"
                type="submit"
              >
                SIGN IN TO DASHBOARD
              </Button>
            </form>
          </div>

          <div className="mt-8 text-center">
            <p className="text-[#2a2a2a] dark:text-white/60 text-xs uppercase tracking-widest font-medium">
              © {new Date().getFullYear()} Harvest Hub Platform. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 p-8 hidden lg:block">
        <div className="flex items-center gap-4 text-gray-800 dark:text-white/50 bg-white/80 dark:bg-black/20 backdrop-blur-md rounded-full px-6 py-2">
          <span className="material-icons text-sm">trending_up</span>
          <span className="text-xs font-semibold tracking-wide">
            SUPPORTING 100+ LOCAL VENDORS
          </span>
        </div>
      </div>
    </div>
  );
}
