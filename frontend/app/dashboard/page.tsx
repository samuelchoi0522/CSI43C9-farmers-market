"use client";

import { useEffect, useState } from "react";
import DarkModeToggle from "../components/DarkModeToggle";
import SidebarNavigation from "../components/SidebarNavigation";
import CategoryRevenueChart from "../components/CategoryRevenueChart";
import Button from "../components/Button";

export default function DashboardPage() {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === "undefined") return false;
    return document.documentElement.classList.contains("dark");
  });
  const userName = "Admin User"; // This would come from auth context/API

  useEffect(() => {
    // Listen for dark mode changes to trigger re-renders
    const checkDarkMode = () => {
      // Force re-render when dark mode changes
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    };
    
    // Listen for dark mode changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    
    // Also listen for custom event
    window.addEventListener("darkModeChange", checkDarkMode);
    
    return () => {
      observer.disconnect();
      window.removeEventListener("darkModeChange", checkDarkMode);
    };
  }, []);

  useEffect(() => {
    // Close user menu when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showUserMenu && !target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const handleLogout = () => {
    // TODO: Implement actual logout logic (clear tokens, redirect, etc.)
    console.log("Logging out...");
    // Example: window.location.href = "/login";
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 min-h-screen flex transition-colors duration-300">
      <DarkModeToggle position="fixed" className="bottom-6 right-6 top-auto" />
      
      <SidebarNavigation activeItem="Financial Overview" />
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 lg:p-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold">Financial Overview</h2>
            <p className="text-slate-700 dark:text-slate-400">Market Performance for {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="flex items-center gap-2">
              <span className="material-icons text-lg leading-none">download</span>
              Financial Report
            </Button>
            <Button variant="primary" className="flex items-center gap-2">
              <span className="material-icons text-lg leading-none">description</span>
              Log Collection
            </Button>
            {/* User Menu */}
            <div className="relative user-menu-container">
              <Button
                onClick={() => setShowUserMenu(!showUserMenu)}
                variant="ghost"
                className="flex items-center gap-2 px-3 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-[#10b981] flex items-center justify-center text-white text-sm font-semibold">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <span 
                  className="text-sm font-medium hidden md:block" 
                  style={{ 
                    color: isDarkMode ? 'rgb(203, 213, 225)' : 'rgb(0, 0, 0)' 
                  }}
                >
                  {userName}
                </span>
                <span className="material-icons text-lg leading-none text-slate-600 dark:text-slate-400">
                  {showUserMenu ? "expand_less" : "expand_more"}
                </span>
              </Button>
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-700">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{userName}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">admin@markethub.com</p>
                  </div>
                  <Button
                    onClick={handleLogout}
                    variant="ghost"
                    size="sm"
                    className="w-full flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <span className="material-icons text-lg leading-none">logout</span>
                    Log Out
                  </Button>
                </div>
              )}
            </div>
          </div>
        </header>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div 
                className="dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-2 rounded-xl flex items-center justify-center" 
                style={{ backgroundColor: isDarkMode ? undefined : 'rgba(219, 234, 254, 0.5)' }}
              >
                <span className="material-icons leading-none">credit_card</span>
              </div>
              <span className="text-xs font-bold text-[#10b981] flex items-center gap-1">
                <span className="material-icons text-sm leading-none">trending_up</span> +12%
              </span>
            </div>
            <p className="text-slate-700 dark:text-slate-400 text-sm font-medium">Gross Market Revenue</p>
            <p className="text-3xl font-bold mt-1">$18,432.50</p>
          </div>
          
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-[#10b981]/10 text-[#10b981] p-2 rounded-xl flex items-center justify-center">
                <span className="material-icons leading-none">attach_money</span>
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-500 uppercase">87% Collected</span>
            </div>
            <p className="text-slate-700 dark:text-slate-400 text-sm font-medium">Total Fees Collected</p>
            <p className="text-3xl font-bold mt-1">$2,840.00</p>
          </div>
          
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div 
                className="dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 p-2 rounded-xl flex items-center justify-center" 
                style={{ backgroundColor: isDarkMode ? undefined : 'rgba(254, 243, 199, 0.5)' }}
              >
                <span className="material-icons leading-none">folder</span>
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-500 uppercase">4 Outstanding</span>
            </div>
            <p className="text-slate-700 dark:text-slate-400 text-sm font-medium">Unpaid Vendor Fees</p>
            <p className="text-3xl font-bold mt-1">$420.00</p>
          </div>
        </div>
        
        {/* Category Revenue Chart */}
        <CategoryRevenueChart />
        
        {/* Vendor Tracking Table */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="font-bold text-lg">Vendor Tracking</h3>
            <div className="flex items-center gap-2">
              <div className="relative">
                <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm leading-none">search</span>
                <input 
                  className="pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-[#10b981] focus:border-[#10b981] w-full md:w-64 outline-none" 
                  placeholder="Search vendors..." 
                  type="text"
                />
              </div>
              <Button variant="outline" size="sm" className="p-2">
                <span className="material-icons block leading-none">filter_list</span>
              </Button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Vendor Name</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Reimbursement (reimb.) due</th>
                  <th className="px-6 py-4">Reported Sales</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                <tr className="hover:bg-slate-50/15 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-semibold">Alba&apos;s Pupusas</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-50 dark:bg-slate-800/20 text-slate-600 dark:text-slate-400">Absent</span>
                  </td>
                  <td className="px-6 py-4 text-sm">Ready-to-Eat</td>
                  <td className="px-6 py-4 font-mono text-sm">$45.00</td>
                  <td className="px-6 py-4 font-mono text-sm">-</td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="sm" className="text-sm text-[#10b981] hover:underline font-medium p-0 h-auto">
                      Mark Paid
                    </Button>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/15 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-semibold">Around the World Bakery</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#10b981]/20 text-[#10b981]">Present</span>
                  </td>
                  <td className="px-6 py-4 text-sm">Bakery Goods</td>
                  <td className="px-6 py-4 font-mono text-sm">$35.00</td>
                  <td className="px-6 py-4 font-mono text-sm">$470.00</td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="sm" className="p-1.5 hover:bg-[#10b981]/10 hover:text-[#10b981] text-slate-400">
                      <span className="material-icons text-lg leading-none">description</span>
                    </Button>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/15 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-semibold">Ary Land &amp; Cattle</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#10b981]/20 text-[#10b981]">Present</span>
                  </td>
                  <td className="px-6 py-4 text-sm">Fresh Meat</td>
                  <td className="px-6 py-4 font-mono text-sm">$35.00</td>
                  <td className="px-6 py-4 font-mono text-sm">$390.00</td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="sm" className="p-1.5 hover:bg-[#10b981]/10 hover:text-[#10b981] text-slate-400">
                      <span className="material-icons text-lg leading-none">description</span>
                    </Button>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/15 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-semibold">Bonnet Farm</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#10b981]/20 text-[#10b981]">Present</span>
                  </td>
                  <td className="px-6 py-4 text-sm">Produce/Plant</td>
                  <td className="px-6 py-4 font-mono text-sm">$55.00</td>
                  <td className="px-6 py-4 font-mono text-sm">$1,150.00</td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="sm" className="p-1.5 hover:bg-[#10b981]/10 hover:text-[#10b981] text-slate-400">
                      <span className="material-icons text-lg leading-none">description</span>
                    </Button>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/15 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-semibold">Broken Grain Bakery</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#10b981]/20 text-[#10b981]">Present</span>
                  </td>
                  <td className="px-6 py-4 text-sm">Bakery Specialty</td>
                  <td className="px-6 py-4 font-mono text-sm">$35.00</td>
                  <td className="px-6 py-4 font-mono text-sm text-[#10b981] font-bold">$2,100.00</td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="sm" className="p-1.5 hover:bg-[#10b981]/10 hover:text-[#10b981] text-slate-400">
                      <span className="material-icons text-lg leading-none">description</span>
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <span className="text-sm text-slate-700 dark:text-slate-500">Showing 1 to 5 of 32 vendors</span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="p-1 px-3" disabled>Previous</Button>
              <Button variant="primary" size="sm" className="p-1 px-3">1</Button>
              <Button variant="outline" size="sm" className="p-1 px-3">2</Button>
              <Button variant="outline" size="sm" className="p-1 px-3">3</Button>
              <Button variant="outline" size="sm" className="p-1 px-3">Next</Button>
            </div>
          </div>
        </div>
        
        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <h4 className="font-bold mb-4">Revenue by Category</h4>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Fresh Produce</span>
                  <span className="font-bold">$8,240 (45%)</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#10b981] h-full" style={{ width: '45%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Ready-to-Eat</span>
                  <span className="font-bold">$5,120 (28%)</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full" style={{ width: '28%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Artisan Crafts</span>
                  <span className="font-bold">$3,072 (17%)</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full" style={{ width: '17%' }}></div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold">Financial Alerts</h4>
              <span className="text-xs text-[#10b981] font-bold cursor-pointer hover:underline">Auditor View</span>
            </div>
            <div className="space-y-4">
              <div className="flex gap-4 items-start">
                <div className="w-2 h-2 rounded-full bg-red-500 mt-2 shrink-0"></div>
                <div>
                  <p className="text-sm font-semibold">Unreported Sales: Ary Land &amp; Cattle</p>
                  <p className="text-xs text-slate-600 dark:text-slate-500">Market day 06/23 sales data not yet submitted for commission.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 shrink-0"></div>
                <div>
                  <p className="text-sm font-semibold">Partial Payment: Alba&apos;s Pupusas</p>
                  <p className="text-xs text-slate-600 dark:text-slate-500">Booth fee balance of $45.00 overdue from morning check-in.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-2 h-2 rounded-full bg-[#10b981] mt-2 shrink-0"></div>
                <div>
                  <p className="text-sm font-semibold">Deposit Successful</p>
                  <p className="text-xs text-slate-600 dark:text-slate-500">Electronic deposit for 06/21 batch confirmed by bank ($12,403.00).</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
