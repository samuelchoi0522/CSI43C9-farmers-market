"use client";

import Link from "next/link";
import Button from "./Button";

interface SidebarNavigationProps {
  /** The currently active navigation item */
  activeItem?: string;
  /** Optional custom className for the sidebar */
  className?: string;
}

export default function SidebarNavigation({ 
  activeItem = "Financial Overview",
  className = ""
}: SidebarNavigationProps) {
  const navigationItems = [
    { id: "Financial Overview", label: "Financial Overview", icon: "dashboard", href: "/dashboard" },
    { id: "Vendors", label: "Vendors", icon: "store", href: "/vendors" },
    { id: "Daily Reports", label: "Daily Reports", icon: "description", href: "#" },
    { id: "Vendor Analytics", label: "Vendor Analytics", icon: "analytics", href: "#" },
    { id: "Revenue Audits", label: "Revenue Audits", icon: "assessment", href: "#" },
  ];

  return (
    <aside className={`w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hidden lg:flex flex-col sticky top-0 h-screen ${className}`}>
      <div className="p-6 flex items-center gap-3">
        <div className="bg-[#10b981] p-2 rounded-lg text-white flex items-center justify-center">
          <span className="material-icons block leading-none">storefront</span>
        </div>
        <h1 className="font-bold text-xl tracking-tight">MarketOS</h1>
      </div>
      
      <nav className="flex-1 px-4 space-y-2 animate-stagger">
        {navigationItems.map((item, index) => {
          const isActive = item.id === activeItem;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 ease-out hover-lift ${
                isActive
                  ? "bg-[#10b981]/10 text-[#10b981] font-medium shadow-sm"
                  : "text-slate-900 dark:text-slate-400 hover:bg-[#10b981]/10 dark:hover:bg-slate-800"
              }`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <span className={`material-icons text-lg leading-none transition-transform duration-200 ${isActive ? "" : "text-slate-900 dark:text-slate-400"} ${!isActive ? "group-hover:scale-110" : ""}`}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 mt-auto">
        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-500 uppercase tracking-wider mb-2">Market Status</p>
          <p className="text-sm font-bold truncate">Downtown Saturday Mar...</p>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[10px] bg-[#10b981]/20 text-[#10b981] px-2 py-0.5 rounded-full font-bold uppercase">Open</span>
            <Button variant="ghost" size="sm" className="p-0 text-slate-400 hover:text-[#10b981]">
              <span className="material-icons text-sm leading-none">settings</span>
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}

