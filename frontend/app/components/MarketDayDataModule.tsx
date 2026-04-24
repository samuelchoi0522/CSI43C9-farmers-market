import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './figma/card';
import { Input } from './figma/input';
import { Label } from './figma/label';
import { getMarketDayData, saveMarketDayData, MarketDayData } from '@/lib/api/marketDayData';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';
import { type VendorTransactionsSheetRowModel as VendorTransactionsSheetRow } from './VendorTransactionsSheetRow';

interface MarketDayDataModuleProps {
  marketDate: string;
  vendorRecords?: VendorTransactionsSheetRow[];
  data: MarketDayData;
  onDataChange: (newData: MarketDayData) => void;
  loading?: boolean;
  saving?: boolean;
  onSave?: () => void;
}

const MarketDayDataModule: React.FC<MarketDayDataModuleProps> = ({ 
  marketDate, 
  vendorRecords = [], 
  data, 
  onDataChange,
  loading,
  saving,
  onSave
}) => {
  // Automatically sync redeemed values from vendor records when they change
  useEffect(() => {
    if (vendorRecords && vendorRecords.length > 0) {
      const snapRedeemed = vendorRecords.reduce((sum, r) => sum + (r.snap || 0), 0);
      const dufbRedeemed = vendorRecords.reduce((sum, r) => sum + (r.dufb || 0), 0);
      const wdfmRedeemed = vendorRecords.reduce((sum, r) => sum + (r.wdfm_tokens || 0), 0);

      if (
        data.snapTokensRedeemed !== snapRedeemed ||
        data.dufbTokensRedeemed !== dufbRedeemed ||
        data.wdfmTokensRedeemed !== wdfmRedeemed
      ) {
        onDataChange({
          ...data,
          snapTokensRedeemed: snapRedeemed,
          dufbTokensRedeemed: dufbRedeemed,
          wdfmTokensRedeemed: wdfmRedeemed,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorRecords]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // If value is empty, set to 0
    if (value === '') {
      onDataChange({ ...data, [name]: 0 });
      return;
    }

    const parsedValue = parseFloat(value);
    
    // Prevent negative numbers
    if (parsedValue < 0) return;

    onDataChange({
      ...data,
      [name]: parsedValue,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Prevent '-' and 'e' (scientific notation) from being typed
    if (e.key === '-' || e.key === 'e' || e.key === 'E') {
      e.preventDefault();
    }
  };

  const snapRedemptionRate = useMemo(() => {
    if (data.snapTokensPurchased === 0) return 0;
    return (data.snapTokensRedeemed / data.snapTokensPurchased) * 100;
  }, [data.snapTokensPurchased, data.snapTokensRedeemed]);

  const dufbRedemptionRate = useMemo(() => {
    if (data.dufbTokensDistributed === 0) return 0;
    return (data.dufbTokensRedeemed / data.dufbTokensDistributed) * 100;
  }, [data.dufbTokensDistributed, data.dufbTokensRedeemed]);

  const totalWdfmDistributed = useMemo(() => {
    return (data.wdfmTokensPurchased || 0) + (data.giftCardsRedeemed || 0) + (data.wdfmTokensForMarketMeals || 0);
  }, [data.wdfmTokensPurchased, data.giftCardsRedeemed, data.wdfmTokensForMarketMeals]);

  const wdfmRedemptionRate = useMemo(() => {
    if (totalWdfmDistributed === 0) return 0;
    return (data.wdfmTokensRedeemed / totalWdfmDistributed) * 100;
  }, [totalWdfmDistributed, data.wdfmTokensRedeemed]);

  if (loading) {
    return (
      <Card className="mb-8">
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-[#10b981]" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-8 border-slate-200 bg-white shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-bold text-slate-900">Market Day Statistics</CardTitle>
        {onSave && (
          <button
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-[#10b981] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#059669] disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Stats
          </button>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* SNAP Section */}
          <div className="space-y-4 rounded-lg border border-slate-100 bg-slate-50/50 p-4">
            <h3 className="font-semibold text-[#10b981]">SNAP Tokens</h3>
            <div className="grid gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="snapTokenTransactions"># Transactions</Label>
                <Input
                  id="snapTokenTransactions"
                  name="snapTokenTransactions"
                  type="number"
                  min="0"
                  step="1"
                  value={data.snapTokenTransactions || ''}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  className="bg-white"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="snapTokensPurchased">$$ Purchased</Label>
                <Input
                  id="snapTokensPurchased"
                  name="snapTokensPurchased"
                  type="number"
                  min="0"
                  step="0.01"
                  value={data.snapTokensPurchased || ''}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  className="bg-white"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="snapTokensRedeemed">$$ Redeemed</Label>
                <Input
                  id="snapTokensRedeemed"
                  name="snapTokensRedeemed"
                  type="number"
                  min="0"
                  step="0.01"
                  value={data.snapTokensRedeemed || ''}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  className="bg-white"
                  readOnly
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-sm font-medium text-slate-600">
                <span>Redemption Rate:</span>
                <span className="text-[#10b981]">{snapRedemptionRate.toFixed(2)}%</span>
              </div>
            </div>
          </div>

          {/* DUFB Section */}
          <div className="space-y-4 rounded-lg border border-slate-100 bg-slate-50/50 p-4">
            <h3 className="font-semibold text-[#10b981]">DUFB Tokens</h3>
            <div className="grid gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="dufbTokenTransactions"># Transactions</Label>
                <Input
                  id="dufbTokenTransactions"
                  name="dufbTokenTransactions"
                  type="number"
                  min="0"
                  step="1"
                  value={data.dufbTokenTransactions || ''}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  className="bg-white"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="dufbTokensDistributed">$$ Distributed</Label>
                <Input
                  id="dufbTokensDistributed"
                  name="dufbTokensDistributed"
                  type="number"
                  min="0"
                  step="0.01"
                  value={data.dufbTokensDistributed || ''}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  className="bg-white"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="dufbTokensRedeemed">$$ Redeemed</Label>
                <Input
                  id="dufbTokensRedeemed"
                  name="dufbTokensRedeemed"
                  type="number"
                  min="0"
                  step="0.01"
                  value={data.dufbTokensRedeemed || ''}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  className="bg-white"
                  readOnly
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-sm font-medium text-slate-600">
                <span>Redemption Rate:</span>
                <span className="text-[#10b981]">{dufbRedemptionRate.toFixed(2)}%</span>
              </div>
            </div>
          </div>

          {/* WDFM Section */}
          <div className="space-y-4 rounded-lg border border-slate-100 bg-slate-50/50 p-4">
            <h3 className="font-semibold text-[#10b981]">WDFM Tokens</h3>
            <div className="grid gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="wdfmTokenTransactions"># Transactions</Label>
                <Input
                  id="wdfmTokenTransactions"
                  name="wdfmTokenTransactions"
                  type="number"
                  min="0"
                  step="1"
                  value={data.wdfmTokenTransactions || ''}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  className="bg-white"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="wdfmTokensPurchased">$$ Purchased</Label>
                <Input
                  id="wdfmTokensPurchased"
                  name="wdfmTokensPurchased"
                  type="number"
                  min="0"
                  step="0.01"
                  value={data.wdfmTokensPurchased || ''}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  className="bg-white"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="giftCardsRedeemed">$$ Gift Cards</Label>
                <Input
                  id="giftCardsRedeemed"
                  name="giftCardsRedeemed"
                  type="number"
                  min="0"
                  step="0.01"
                  value={data.giftCardsRedeemed || ''}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  className="bg-white"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="wdfmTokensForMarketMeals">$$ Market Meals</Label>
                <Input
                  id="wdfmTokensForMarketMeals"
                  name="wdfmTokensForMarketMeals"
                  type="number"
                  min="0"
                  step="0.01"
                  value={data.wdfmTokensForMarketMeals || ''}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  className="bg-white"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="wdfmTokensRedeemed">$$ Redeemed</Label>
                <Input
                  id="wdfmTokensRedeemed"
                  name="wdfmTokensRedeemed"
                  type="number"
                  min="0"
                  step="0.01"
                  value={data.wdfmTokensRedeemed || ''}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  className="bg-white"
                  readOnly
                />
              </div>
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between text-sm font-medium text-slate-600">
                  <span>Total Distributed:</span>
                  <span className="text-[#10b981]">${totalWdfmDistributed.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm font-medium text-slate-600">
                  <span>Redemption Rate:</span>
                  <span className="text-[#10b981]">{wdfmRedemptionRate.toFixed(2)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MarketDayDataModule;
