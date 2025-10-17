"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { StatementData } from "@/app/page";
import { formatCurrency } from "@/lib/utils";

type HistoricalComparisonProps = {
  statements: StatementData[];
};

export default function HistoricalComparison({ statements }: HistoricalComparisonProps) {
  // Sort statements by period
  const sortedStatements = [...statements].sort((a, b) => a.period.localeCompare(b.period));

  const chartData = sortedStatements.map(stmt => ({
    period: stmt.period,
    totalFees: Math.round(stmt.summary.totalFees * 100) / 100,
    overnightFees: Math.round(stmt.totalOvernightFees * 100) / 100,
    locateCosts: Math.round(stmt.totalLocateCosts * 100) / 100,
    avgDaily: Math.round(stmt.summary.avgDailyOvernightCost * 100) / 100,
  }));

  // Calculate trends
  const currentMonth = chartData[chartData.length - 1];
  const previousMonth = chartData[chartData.length - 2];
  const feeChange = previousMonth 
    ? ((currentMonth.totalFees - previousMonth.totalFees) / previousMonth.totalFees) * 100 
    : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Historical Fee Comparison</CardTitle>
          <CardDescription>
            Comparing {statements.length} statement{statements.length > 1 ? 's' : ''}
            {feeChange !== 0 && (
              <span className={`ml-2 font-semibold ${feeChange > 0 ? 'text-red-500' : 'text-green-500'}`}>
                {feeChange > 0 ? '↑' : '↓'} {Math.abs(feeChange).toFixed(1)}% vs previous month
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="period" 
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
              <Line 
                type="monotone" 
                dataKey="totalFees" 
                stroke="#ef4444" 
                strokeWidth={2}
                name="Total Fees" 
                dot={{ r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="overnightFees" 
                stroke="#f97316" 
                strokeWidth={2}
                name="Overnight Fees" 
                dot={{ r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="locateCosts" 
                stroke="#eab308" 
                strokeWidth={2}
                name="Locate Costs" 
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Month-over-Month Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle>Statement Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Period</th>
                  <th className="text-right py-2">Total Fees</th>
                  <th className="text-right py-2">Overnight Fees</th>
                  <th className="text-right py-2">Locate Costs</th>
                  <th className="text-right py-2">Avg Daily</th>
                  <th className="text-right py-2">Days</th>
                </tr>
              </thead>
              <tbody>
                {sortedStatements.map((stmt, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2 font-medium">{stmt.period}</td>
                    <td className="text-right text-red-600 dark:text-red-400 font-semibold">
                      {formatCurrency(stmt.summary.totalFees)}
                    </td>
                    <td className="text-right">{formatCurrency(stmt.totalOvernightFees)}</td>
                    <td className="text-right">{formatCurrency(stmt.totalLocateCosts)}</td>
                    <td className="text-right">{formatCurrency(stmt.summary.avgDailyOvernightCost)}</td>
                    <td className="text-right">{stmt.summary.daysAnalyzed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


