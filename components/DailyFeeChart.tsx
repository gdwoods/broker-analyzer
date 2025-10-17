"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { BorrowPosition } from "@/app/page";
import { formatCurrency } from "@/lib/utils";

type DailyFeeChartProps = {
  positions: BorrowPosition[];
};

export default function DailyFeeChart({ positions }: DailyFeeChartProps) {
  // Group by date
  const dailyData = new Map<string, { overnightFee: number; locateCost: number }>();
  
  for (const pos of positions) {
    const existing = dailyData.get(pos.date) || { overnightFee: 0, locateCost: 0 };
    dailyData.set(pos.date, {
      overnightFee: existing.overnightFee + pos.overnightFee,
      locateCost: existing.locateCost + pos.locateCost,
    });
  }

  // Convert to array and sort by date
  const chartData = Array.from(dailyData.entries())
    .map(([date, data]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      overnightFee: Math.round(data.overnightFee * 100) / 100,
      locateCost: Math.round(data.locateCost * 100) / 100,
      total: Math.round((data.overnightFee + data.locateCost) * 100) / 100,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Fee Breakdown</CardTitle>
        <CardDescription>Overnight fees and locate costs by day</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              className="text-xs"
              tick={{ fill: 'currentColor' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'currentColor' }}
              tickFormatter={(value) => `$${value.toLocaleString()}`}
            />
            <Tooltip 
              formatter={(value) => formatCurrency(value as number)}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.5rem',
              }}
            />
            <Legend />
            <Bar dataKey="overnightFee" fill="#f97316" name="Overnight Fees" stackId="a" />
            <Bar dataKey="locateCost" fill="#eab308" name="Locate Costs" stackId="a" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}


