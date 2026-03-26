"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface CategoryData {
  category: string;
  revenue: number;
}

interface CategoryRevenueChartProps {
  data?: CategoryData[];
}

const FALLBACK_DEMO: CategoryData[] = [
  { category: "Agriculture", revenue: 8240 },
  { category: "Handcrafted Goods", revenue: 5120 },
  { category: "Bakery", revenue: 3072 },
  { category: "Ready-to-Eat", revenue: 2450 },
  { category: "Artisan Crafts", revenue: 1800 },
];

export default function CategoryRevenueChart({ data }: CategoryRevenueChartProps) {
  const source = data !== undefined ? data : FALLBACK_DEMO;
  const hasApiData = data !== undefined;
  const isEmpty = hasApiData && source.length === 0;

  const colors = [
    "#10b981", // emerald-500 (green)
    "#3b82f6", // blue-500
    "#f59e0b", // amber-500 (orange)
    "#ec4899", // pink-500
    "#8b5cf6", // violet-500 (purple)
  ];

  const chartData = source.map((item, index) => ({
    name: item.category,
    revenue: item.revenue,
    color: colors[index % colors.length],
  }));

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8 w-full">
      <h3 className="font-bold text-lg mb-6 text-slate-900">Revenue by Category</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid 
            strokeDasharray="4 4" 
            stroke="#e2e8f0"
          />
          <XAxis 
            dataKey="name" 
            tick={{ fill: '#64748b', fontSize: 12 }}
            angle={0}
            textAnchor="middle"
            height={40}
          />
          <YAxis 
            tick={{ fill: '#64748b', fontSize: 12 }}
            tickFormatter={(value) => `$${value.toLocaleString()}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
            }}
            formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
            labelStyle={{ color: '#1e293b' }}
          />
          <Bar 
            dataKey="revenue" 
            radius={[4, 4, 0, 0]}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      ) : null}
    </div>
  );
}
