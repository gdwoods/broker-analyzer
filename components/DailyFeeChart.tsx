"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, ComposedChart, LabelList } from "recharts";
import type { BorrowPosition } from "@/app/page";
import { formatCurrency } from "@/lib/utils";

type DailyFeeChartProps = {
  positions: BorrowPosition[];
};

export default function DailyFeeChart({ positions }: DailyFeeChartProps) {
  // Group by date with expense fees and P&L
  const dailyData = new Map<string, { 
    overnightFee: number; 
    locateCost: number;
    commissions: number;
    miscFees: number;
    grossPnL: number;
    totalFees: number;
  }>();
  
  for (const pos of positions) {
    const existing = dailyData.get(pos.date) || { 
      overnightFee: 0, 
      locateCost: 0,
      commissions: 0,
      miscFees: 0,
      grossPnL: 0,
      totalFees: 0
    };
    
    // Calculate gross P&L (net P&L + total fees)
    const totalFees = pos.overnightFee + pos.locateCost + pos.commissions + pos.miscFees + pos.marketDataFee - pos.rebates - pos.interestIncome;
    const grossPnL = (pos.pnl || 0) + totalFees;
    
    // Debug logging
    if (isNaN(grossPnL)) {
      console.log('🚨 NaN Gross P&L detected:', {
        symbol: pos.symbol,
        date: pos.date,
        pnl: pos.pnl,
        totalFees,
        grossPnL,
        fees: {
          overnightFee: pos.overnightFee,
          locateCost: pos.locateCost,
          commissions: pos.commissions,
          miscFees: pos.miscFees,
          marketDataFee: pos.marketDataFee,
          rebates: pos.rebates,
          interestIncome: pos.interestIncome
        }
      });
    }
    
    // Calculate total expense fees for this position (Locate + Overnight + Commissions + Misc)
    const expenseFees = pos.overnightFee + pos.locateCost + pos.commissions + pos.miscFees;
    
    dailyData.set(pos.date, {
      overnightFee: existing.overnightFee + pos.overnightFee,
      locateCost: existing.locateCost + pos.locateCost,
      commissions: existing.commissions + pos.commissions,
      miscFees: existing.miscFees + pos.miscFees,
      grossPnL: existing.grossPnL + grossPnL,
      totalFees: existing.totalFees + expenseFees,
    });
  }

  // Convert to array and sort by date
  const chartData = Array.from(dailyData.entries())
    .map(([date, data]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      grossPnL: isNaN(data.grossPnL) ? 0 : Math.round(data.grossPnL * 100) / 100,
      locateCost: Math.round(data.locateCost * 100) / 100,
      overnightFee: Math.round(data.overnightFee * 100) / 100,
      commissions: Math.round(data.commissions * 100) / 100,
      miscFees: Math.round(data.miscFees * 100) / 100,
      totalFees: Math.round(data.totalFees * 100) / 100,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Fee Breakdown & P&L</CardTitle>
        <CardDescription>Daily expense fees (stacked bars) and Gross P&L (separate line)</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              className="text-xs"
              tick={{ fill: 'currentColor' }}
            />
            <YAxis 
              yAxisId="left"
              className="text-xs"
              tick={{ fill: 'currentColor' }}
              tickFormatter={(value) => `$${value.toLocaleString()}`}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              className="text-xs"
              tick={{ fill: 'currentColor' }}
              tickFormatter={(value) => `$${value.toLocaleString()}`}
            />
            <Tooltip 
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                      <p className="font-medium mb-2">Date: {label}</p>
                      <div className="space-y-1">
                        <p className="text-sm">
                          <span className="text-blue-600">Gross P&L:</span> {formatCurrency(data.grossPnL)}
                        </p>
                        <p className="text-sm">
                          <span className="text-yellow-600">Locate Costs:</span> {formatCurrency(data.locateCost)}
                        </p>
                        <p className="text-sm">
                          <span className="text-orange-600">Overnight Fees:</span> {formatCurrency(data.overnightFee)}
                        </p>
                        <p className="text-sm">
                          <span className="text-purple-600">Commissions:</span> {formatCurrency(data.commissions)}
                        </p>
                        <p className="text-sm">
                          <span className="text-cyan-600">Misc Fees:</span> {formatCurrency(data.miscFees)}
                        </p>
                        <hr className="my-2" />
                        <p className="text-sm font-semibold">
                          <span className="text-gray-700 dark:text-gray-300">Total Fees:</span> {formatCurrency(data.totalFees)}
                        </p>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            {/* Gross P&L line - appears first in legend */}
            <Line 
              yAxisId="right" 
              type="monotone" 
              dataKey="grossPnL" 
              stroke="#3b82f6" 
              strokeWidth={3}
              name="Gross P&L"
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            />
            {/* Stacked bars in order: Locate Costs, Overnight Fees, Commissions, Misc Fees */}
            <Bar yAxisId="left" dataKey="locateCost" fill="#eab308" name="Locate Costs" stackId="fees" />
            <Bar yAxisId="left" dataKey="overnightFee" fill="#f97316" name="Overnight Fees" stackId="fees" />
            <Bar yAxisId="left" dataKey="commissions" fill="#8b5cf6" name="Commissions" stackId="fees" />
            <Bar 
              yAxisId="left" 
              dataKey="miscFees" 
              fill="#06b6d4" 
              name="Misc Fees" 
              stackId="fees"
            >
              <LabelList 
                dataKey="totalFees" 
                position="top"
                formatter={(value: unknown) => {
                  // Only show labels for bars that are tall enough
                  if (typeof value === 'number' && value > 200) { // Higher threshold for dense charts
                    return `$${value.toFixed(0)}`;
                  }
                  return '';
                }}
                style={{
                  fontSize: '10px',
                  fill: 'currentColor',
                  fontWeight: 'bold'
                }}
              />
            </Bar>
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              content={(props) => {
                const { payload } = props;
                // Custom legend with explicit ordering
                const orderedPayload = [
                  payload?.find(item => item.value === 'Gross P&L'),
                  payload?.find(item => item.value === 'Locate Costs'),
                  payload?.find(item => item.value === 'Overnight Fees'),
                  payload?.find(item => item.value === 'Commissions'),
                  payload?.find(item => item.value === 'Misc Fees')
                ].filter(Boolean);
                
                return (
                  <div style={{ textAlign: 'center', paddingTop: '20px' }}>
                    {orderedPayload.map((entry, index) => (
                      <span key={index} style={{ margin: '0 10px', display: 'inline-block' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            width: entry?.type === 'line' ? '20px' : '12px',
                            height: entry?.type === 'line' ? '2px' : '12px',
                            backgroundColor: entry?.color,
                            marginRight: '5px',
                            verticalAlign: 'middle'
                          }}
                        />
                        <span style={{ fontSize: '12px', color: 'currentColor' }}>
                          {entry?.value}
                        </span>
                      </span>
                    ))}
                  </div>
                );
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}


