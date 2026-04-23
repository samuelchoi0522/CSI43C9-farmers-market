import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './figma/card';
import { Input } from './figma/input';
import { Label } from './figma/label';
import { getMarketDayData, saveMarketDayData, MarketDayData } from '@/lib/api/marketDayData';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';

interface MarketDayDataModuleProps {
  marketDate: string;
}

const MarketDayDataModule: React.FC<MarketDayDataModuleProps> = ({ marketDate }) => {
  const [data, setData] = useState<MarketDayData>({
    marketDate,
    snapTokenTransactions: 0,
    snapTokensPurchased: 0,
    snapTokensRedeemed: 0,
    dufbTokenTransactions: 0,
    dufbTokensDistributed: 0,
    dufbTokensRedeemed: 0,
    wdfmTokenTransactions: 0,
    wdfmTokensPurchased: 0,
    giftCardsRedeemed: 0,
    wdfmTokensForMarketMeals: 0,
    wdfmTokensRedeemed: 0,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await getMarketDayData(marketDate);
        setData({
            ...result,
            marketDate, // Ensure date matches current market date
            snapTokenTransactions: result.snapTokenTransactions ?? 0,
            snapTokensPurchased: result.snapTokensPurchased ?? 0,
            snapTokensRedeemed: result.snapTokensRedeemed ?? 0,
            dufbTokenTransactions: result.dufbTokenTransactions ?? 0,
            dufbTokensDistributed: result.dufbTokensDistributed ?? 0,
            dufbTokensRedeemed: result.dufbTokensRedeemed ?? 0,
            wdfmTokenTransactions: result.wdfmTokenTransactions ?? 0,
            wdfmTokensPurchased: result.wdfmTokensPurchased ?? 0,
            giftCardsRedeemed: result.giftCardsRedeemed ?? 0,
            wdfmTokensForMarketMeals: result.wdfmTokensForMarketMeals ?? 0,
            wdfmTokensRedeemed: result.wdfmTokensRedeemed ?? 0,
        });
      } catch (error) {
        console.error('Failed to fetch market day data:', error);
        toast.error('Failed to load market day data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [marketDate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    
    // If value is empty, set to 0
    if (value === '') {
      setData((prev) => ({ ...prev, [name]: 0 }));
      return;
    }

    const parsedValue = parseFloat(value);
    
    // Prevent negative numbers
    if (parsedValue < 0) return;

    setData((prev) => ({
      ...prev,
      [name]: parsedValue,
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Prevent '-' and 'e' (scientific notation) from being typed
    if (e.key === '-' || e.key === 'e' || e.key === 'E') {
      e.preventDefault();
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveMarketDayData(data);
      toast.success('Market day data saved');
    } catch (error) {
      console.error('Failed to save market day data:', error);
      toast.error('Failed to save market day data');
    } finally {
      setSaving(false);
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
    return data.wdfmTokensPurchased + data.giftCardsRedeemed + data.wdfmTokensForMarketMeals;
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
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-[#10b981] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#059669] disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Save Stats
        </button>
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
