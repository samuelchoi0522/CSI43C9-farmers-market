import { apiRequest } from './client';

export interface MarketDayData {
  marketDate: string;
  snapTokenTransactions: number;
  snapTokensPurchased: number;
  snapTokensRedeemed: number;
  dufbTokenTransactions: number;
  dufbTokensDistributed: number;
  dufbTokensRedeemed: number;
  wdfmTokenTransactions: number;
  wdfmTokensPurchased: number;
  giftCardsRedeemed: number;
  wdfmTokensForMarketMeals: number;
  wdfmTokensRedeemed: number;
}

export const getMarketDayData = async (date: string): Promise<MarketDayData> => {
  return apiRequest<MarketDayData>(`/api/market-day-data/${date}`, {
    method: 'GET',
  });
};

export const saveMarketDayData = async (data: MarketDayData): Promise<MarketDayData> => {
  return apiRequest<MarketDayData>('/api/market-day-data', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};
