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
  const [localData, setLocalData] = useState<MarketDayData>(data);

  // Sync local state when external data (props) changes
  useEffect(() => {
    setLocalData(data);
  }, [data]);

  // Automatically sync redeemed values from vendor records when they change
  useEffect(() => {
    if (vendorRecords && vendorRecords.length > 0) {
      const snapRedeemed = Math.round(vendorRecords.reduce((sum, r) => sum + (r.snap || 0), 0) * 100) / 100;
      const dufbRedeemed = Math.round(vendorRecords.reduce((sum, r) => sum + (r.dufb || 0), 0) * 100) / 100;
      const wdfmRedeemed = Math.round(vendorRecords.reduce((sum, r) => sum + (r.wdfm_tokens || 0), 0) * 100) / 100;

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
    
    // Update local state immediately for snappy UI
    setLocalData(prev => ({
      ...prev,
      [name]: value === '' ? 0 : parseFloat(value)
    }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (value === '') {
      onDataChange({ ...data, [name]: 0 });
      return;
    }

    let parsedValue = parseFloat(value);
    if (parsedValue < 0) parsedValue = 0;

    // Round to 2 decimal places for currency fields
    if (name.includes('Purchased') || name.includes('Redeemed') || name.includes('Distributed') || name.includes('Cards') || name.includes('Meals')) {
      parsedValue = Math.round(parsedValue * 100) / 100;
    }

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
    const purchased = localData.snapTokensPurchased || 0;
    const redeemed = localData.snapTokensRedeemed || 0;
    if (purchased === 0) return null;
    const rate = (redeemed / purchased) * 100;
    return isFinite(rate) ? rate : null;
  }, [localData.snapTokensPurchased, localData.snapTokensRedeemed]);

  const dufbRedemptionRate = useMemo(() => {
    const distributed = localData.dufbTokensDistributed || 0;
    const redeemed = localData.dufbTokensRedeemed || 0;
    if (distributed === 0) return null;
    const rate = (redeemed / distributed) * 100;
    return isFinite(rate) ? rate : null;
  }, [localData.dufbTokensDistributed, localData.dufbTokensRedeemed]);

  const totalWdfmDistributed = useMemo(() => {
    return (localData.wdfmTokensPurchased || 0) + (localData.giftCardsRedeemed || 0) + (localData.wdfmTokensForMarketMeals || 0);
  }, [localData.wdfmTokensPurchased, localData.giftCardsRedeemed, localData.wdfmTokensForMarketMeals]);

  const wdfmRedemptionRate = useMemo(() => {
    const redeemed = localData.wdfmTokensRedeemed || 0;
    if (totalWdfmDistributed === 0) return null;
    const rate = (redeemed / totalWdfmDistributed) * 100;
    return isFinite(rate) ? rate : null;
  }, [totalWdfmDistributed, localData.wdfmTokensRedeemed]);

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
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
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
                  value={localData.snapTokenTransactions || ''}
                  onChange={handleChange}
                  onBlur={handleBlur}
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
                  value={localData.snapTokensPurchased || ''}
                  onChange={handleChange}
                  onBlur={handleBlur}
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
                  value={localData.snapTokensRedeemed || ''}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                  className="bg-white"
                  readOnly
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-sm font-medium text-slate-600">
                <span>Redemption Rate:</span>
                <span className="text-[#10b981]">
                  {snapRedemptionRate !== null ? `${snapRedemptionRate.toFixed(2)}%` : 'N/A'}
                </span>
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
                  value={localData.dufbTokenTransactions || ''}
                  onChange={handleChange}
                  onBlur={handleBlur}
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
                  value={localData.dufbTokensDistributed || ''}
                  onChange={handleChange}
                  onBlur={handleBlur}
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
                  value={localData.dufbTokensRedeemed || ''}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                  className="bg-white"
                  readOnly
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-sm font-medium text-slate-600">
                <span>Redemption Rate:</span>
                <span className="text-[#10b981]">
                  {dufbRedemptionRate !== null ? `${dufbRedemptionRate.toFixed(2)}%` : 'N/A'}
                </span>
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
                  value={localData.wdfmTokenTransactions || ''}
                  onChange={handleChange}
                  onBlur={handleBlur}
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
                  value={localData.wdfmTokensPurchased || ''}
                  onChange={handleChange}
                  onBlur={handleBlur}
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
                  value={localData.wdfmTokensRedeemed || ''}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                  className="bg-white"
                  readOnly
                />
              </div>
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between text-sm font-medium text-slate-600">
                  <span>Total Dist:</span>
                  <span className="text-[#10b981]">${totalWdfmDistributed.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm font-medium text-slate-600">
                  <span>Rate:</span>
                  <span className="text-[#10b981]">
                    {wdfmRedemptionRate !== null ? `${wdfmRedemptionRate.toFixed(2)}%` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Other Section */}
          <div className="space-y-4 rounded-lg border border-slate-100 bg-slate-50/50 p-4">
            <h3 className="font-semibold text-[#10b981]">Other Programs</h3>
            <div className="grid gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="giftCardsRedeemed">$$ Gift Cards</Label>
                <Input
                  id="giftCardsRedeemed"
                  name="giftCardsRedeemed"
                  type="number"
                  min="0"
                  step="0.01"
                  value={localData.giftCardsRedeemed || ''}
                  onChange={handleChange}
                  onBlur={handleBlur}
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
                  value={localData.wdfmTokensForMarketMeals || ''}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                  className="bg-white"
                />
              </div>
              <div className="mt-2 text-xs text-slate-500 italic">
                These values contribute to the Total WDFM Distributed.
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MarketDayDataModule;
