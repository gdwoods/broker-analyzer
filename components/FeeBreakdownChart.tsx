"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import type { StatementData } from "@/app/page";
import { formatCurrency } from "@/lib/utils";

type FeeBreakdownChartProps = {
  statement: StatementData;
};

const COLORS = {
  borrowFees: '#f97316', // orange
  locateCosts: '#eab308', // yellow
};

export default function FeeBreakdownChart({ statement }: FeeBreakdownChartProps) {
    const data = [
      { 
        name: 'Overnight Fees', 
        value: Math.round(statement.totalOvernightFees * 100) / 100, 
        color: COLORS.borrowFees,
        formattedValue: formatCurrency(Math.round(statement.totalOvernightFees * 100) / 100)
      },
      { 
        name: 'Locate Costs', 
        value: Math.round(statement.totalLocateCosts * 100) / 100, 
        color: COLORS.locateCosts,
        formattedValue: formatCurrency(Math.round(statement.totalLocateCosts * 100) / 100)
      },
      { 
        name: 'Commissions', 
        value: Math.round(statement.totalCommissions * 100) / 100, 
        color: '#f97316', // orange
        formattedValue: formatCurrency(Math.round(statement.totalCommissions * 100) / 100)
      },
      { 
        name: 'Misc Fees', 
        value: Math.round(statement.totalMiscFees * 100) / 100, 
        color: '#f59e0b', // amber
        formattedValue: formatCurrency(Math.round(statement.totalMiscFees * 100) / 100)
      },
      { 
        name: 'Market Data', 
        value: Math.round(statement.totalMarketDataFees * 100) / 100, 
        color: '#8b5cf6', // purple
        formattedValue: formatCurrency(Math.round(statement.totalMarketDataFees * 100) / 100)
      },
      { 
        name: 'Interest', 
        value: Math.round(statement.totalInterestFees * 100) / 100, 
        color: '#06b6d4', // cyan
        formattedValue: formatCurrency(Math.round(statement.totalInterestFees * 100) / 100)
      },
      { 
        name: 'Other Fees', 
        value: Math.round(statement.totalOtherFees * 100) / 100, 
        color: '#6b7280', // gray
        formattedValue: formatCurrency(Math.round(statement.totalOtherFees * 100) / 100)
      },
    ].filter(item => item.value > 0);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fee Breakdown</CardTitle>
        <CardDescription>Distribution of all fee types including commissions and rebates</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={true}
              label={(props) => (props.payload as { formattedValue?: string })?.formattedValue || ''}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value, name) => {
                const percentage = ((value as number / total) * 100).toFixed(1);
                return [
                  formatCurrency(value as number),
                  `${name}: ${percentage}%`
                ];
              }}
              labelFormatter={() => ''}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

