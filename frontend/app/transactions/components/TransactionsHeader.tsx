"use client";

import React, { useState, useEffect } from 'react';
import { Loader2, Download } from 'lucide-react';
import Button from '../../components/Button';
import { AddVendorDialog } from '../../components/AddVendorDialog';
import { useAuth } from '@/contexts/AuthContext';
import { Vendor } from '../utils';

interface TransactionsHeaderProps {
  currentMarketDate: string;
  onMarketDateChange: (date: string) => void;
  isImporting: boolean;
  onImportClick: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  allVendors: Vendor[];
  onAddVendor: (vendor: Vendor) => void;
}

export default function TransactionsHeader({
  currentMarketDate,
  onMarketDateChange,
  isImporting,
  onImportClick,
  fileInputRef,
  onFileChange,
  allVendors,
  onAddVendor
}: TransactionsHeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, logout } = useAuth();
  const userName = user?.username || "Admin User";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showUserMenu && !target.closest('.user-menu-container')) setShowUserMenu(false);
    };
    if (showUserMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

  return (
    <>
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 animate-slide-up">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Sales Spreadsheet</h2>
          <p className="text-slate-700 dark:text-slate-400 mt-1">Manage vendor sales data, reimbursements, and produce estimates.</p>
        </div>
        <div className="flex items-center gap-3">
          <input 
            type="file"
            ref={fileInputRef}
            onChange={onFileChange}
            accept=".xlsx,.xls,.csv"
            className="hidden"
          />
          <button
            onClick={onImportClick}
            disabled={isImporting}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all border shadow-sm
              ${isImporting
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed' 
                : 'bg-white dark:bg-slate-800 text-[#10b981] border-[#10b981]/30 dark:border-slate-700 hover:bg-[#10b981]/10 dark:hover:bg-slate-700'}
            `}
          >
            {isImporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            Import Excel
          </button>
          
          <AddVendorDialog vendors={allVendors} onAdd={onAddVendor} />
          
          <div className="relative user-menu-container">
            <Button
              onClick={() => setShowUserMenu(!showUserMenu)}
              variant="ghost"
              className="flex items-center gap-2 px-3 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-[#10b981] flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 aspect-square">
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium hidden md:block text-slate-900 dark:text-slate-200">
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
                </div>
                <Button
                  onClick={() => { logout(); setShowUserMenu(false); }}
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

      <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-end gap-4">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 shadow-sm flex items-center gap-3">
          <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Market Date</span>
          <input 
            type="date"
            className="bg-transparent border-none focus:ring-0 text-slate-900 dark:text-slate-100 font-medium outline-none cursor-pointer"
            value={currentMarketDate}
            onChange={(e) => onMarketDateChange(e.target.value)}
          />
        </div>
      </div>
    </>
  );
}
