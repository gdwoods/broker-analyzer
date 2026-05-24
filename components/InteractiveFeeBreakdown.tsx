"use client";

import { useState, useMemo } from 'react';
import type { BorrowPosition } from '@/app/page';

interface InteractiveFeeBreakdownProps {
  positions: BorrowPosition[];
}

interface FeeCategory {
  name: string;
  value: number;
  color: string;
  subcategories?: FeeCategory[];
}

export default function InteractiveFeeBreakdown({ positions }: InteractiveFeeBreakdownProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [drillDownLevel, setDrillDownLevel] = useState<'main' | 'symbol' | 'date'>('main');
  const [originalFeeCategory, setOriginalFeeCategory] = useState<string | null>(null);

  const feeData = useMemo(() => {
    const totalLocateCosts = positions.reduce((sum, p) => sum + p.locateCost, 0);
    const totalOvernightFees = positions.reduce((sum, p) => sum + p.overnightFee, 0);
    const totalCommissions = positions.reduce((sum, p) => sum + p.commissions, 0);
    const totalMiscFees = positions.reduce((sum, p) => sum + p.miscFees, 0);
    const totalRebates = positions.reduce((sum, p) => sum + p.rebates, 0);
    const totalInterestIncome = positions.reduce((sum, p) => sum + p.interestIncome, 0);
    const totalMarketDataFees = positions.reduce((sum, p) => sum + p.marketDataFee, 0);

    const mainCategories: FeeCategory[] = [
      { name: 'Overnight Fees', value: totalOvernightFees, color: '#f97316' },
      { name: 'Locate Costs', value: totalLocateCosts, color: '#eab308' },
      { name: 'Commissions', value: totalCommissions, color: '#8b5cf6' },
      { name: 'Misc Fees', value: totalMiscFees, color: '#06b6d4' },
      { name: 'Interest Income', value: -totalInterestIncome, color: '#22c55e' },
      { name: 'Market Data', value: totalMarketDataFees, color: '#10b981' },
      { name: 'Rebates', value: -totalRebates, color: '#84cc16' }, // Negative value for rebates
    ];

    // Symbol breakdown
    const symbolBreakdown = positions.reduce((acc, position) => {
      const symbol = position.symbol;
      if (!acc[symbol]) {
        acc[symbol] = {
          locate: 0, overnight: 0, commissions: 0, misc: 0, 
          interestIncome: 0, marketData: 0, rebates: 0
        };
      }
      acc[symbol].locate += position.locateCost;
      acc[symbol].overnight += position.overnightFee;
      acc[symbol].commissions += position.commissions;
      acc[symbol].misc += position.miscFees;
      acc[symbol].interestIncome += position.interestIncome;
      acc[symbol].marketData += position.marketDataFee;
      acc[symbol].rebates += position.rebates;
      return acc;
    }, {} as Record<string, {
      locate: number;
      overnight: number;
      commissions: number;
      misc: number;
      interestIncome: number;
      marketData: number;
      rebates: number;
    }>);

    // Date breakdown
    const dateBreakdown = positions.reduce((acc, position) => {
      const date = position.date;
      if (!acc[date]) {
        acc[date] = {
          locate: 0, overnight: 0, commissions: 0, misc: 0, 
          interestIncome: 0, marketData: 0, rebates: 0
        };
      }
      acc[date].locate += position.locateCost;
      acc[date].overnight += position.overnightFee;
      acc[date].commissions += position.commissions;
      acc[date].misc += position.miscFees;
      acc[date].interestIncome += position.interestIncome;
      acc[date].marketData += position.marketDataFee;
      acc[date].rebates += position.rebates;
      return acc;
    }, {} as Record<string, {
      locate: number;
      overnight: number;
      commissions: number;
      misc: number;
      interestIncome: number;
      marketData: number;
      rebates: number;
    }>);

    return {
      main: mainCategories,
      symbols: symbolBreakdown,
      dates: dateBreakdown
    };
  }, [positions]);

  const getCurrentData = () => {
    if (drillDownLevel === 'symbol' && selectedCategory) {
      // Show symbols that have the selected fee category
      const symbolEntries = Object.entries(feeData.symbols).map(([symbol, data]) => {
        let value = 0;
        switch (selectedCategory) {
          case 'Locate Costs': value = data.locate; break;
          case 'Overnight Fees': value = data.overnight; break;
          case 'Commissions': value = data.commissions; break;
          case 'Misc Fees': value = data.misc; break;
          case 'Interest Income': value = data.interestIncome; break;
          case 'Market Data': value = data.marketData; break;
          case 'Rebates': value = -data.rebates; break;
        }
        return { name: symbol, value, color: `hsl(${Math.random() * 360}, 70%, 50%)` };
      }).filter(cat => cat.value > 0);
      
      return symbolEntries;
    }

    if (drillDownLevel === 'date' && selectedCategory && originalFeeCategory) {
      // Show dates that have the selected symbol with the specific fee type
      const symbolPositions = positions.filter(p => p.symbol === selectedCategory);
      
      // Group by date and calculate the specific fee type for each date
      const dateGroups = symbolPositions.reduce((acc, position) => {
        const date = position.date;
        if (!acc[date]) {
          acc[date] = 0;
        }
        
        // Add the specific fee type based on the original category
        switch (originalFeeCategory) {
          case 'Locate Costs': acc[date] += position.locateCost; break;
          case 'Overnight Fees': acc[date] += position.overnightFee; break;
          case 'Commissions': acc[date] += position.commissions; break;
          case 'Misc Fees': acc[date] += position.miscFees; break;
          case 'Interest Income': acc[date] += position.interestIncome; break;
          case 'Market Data': acc[date] += position.marketDataFee; break;
          case 'Rebates': acc[date] += position.rebates; break;
        }
        
        return acc;
      }, {} as Record<string, number>);

      const dateEntries = Object.entries(dateGroups)
        .filter(([, value]) => value > 0)
        .map(([date, value]) => ({
          name: new Date(date).toLocaleDateString(),
          value,
          color: `hsl(${Math.random() * 360}, 70%, 50%)`
        }));
      
      return dateEntries;
    }

    return feeData.main.filter(cat => cat.value > 0);
  };

  const totalValue = getCurrentData().reduce((sum, cat) => sum + Math.abs(cat.value), 0);

  const handleCategoryClick = (category: string) => {
    if (drillDownLevel === 'main') {
      // Show symbol breakdown - show all symbols that have this fee type
      setSelectedCategory(category);
      setOriginalFeeCategory(category);
      setDrillDownLevel('symbol');
    } else if (drillDownLevel === 'symbol') {
      // Show date breakdown for this symbol
      setSelectedCategory(category);
      setDrillDownLevel('date');
    }
  };

  const handleBack = () => {
    if (drillDownLevel === 'date') {
      setDrillDownLevel('symbol');
    } else if (drillDownLevel === 'symbol') {
      setDrillDownLevel('main');
      setSelectedCategory(null);
      setOriginalFeeCategory(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-lg">🎯 Interactive Fee Breakdown</h4>
          <span className="text-xs text-muted-foreground" title="Click on pie slices to drill down into symbols and dates">
            💡 Click to explore
          </span>
        </div>
        {drillDownLevel !== 'main' && (
          <button
            onClick={handleBack}
            className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            ← Back
          </button>
        )}
      </div>

      {/* Breadcrumb */}
      <div className="text-sm text-muted-foreground">
        {drillDownLevel === 'main' && 'Main Categories'}
        {drillDownLevel === 'symbol' && `${selectedCategory} by Symbol`}
        {drillDownLevel === 'date' && `${originalFeeCategory} for ${selectedCategory} by Date`}
      </div>

      {/* Pie Chart */}
      <div className="flex items-center justify-center">
        <div className="relative w-64 h-64">
          <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
            {(() => {
              let cumulativePercentage = 0;
              return getCurrentData().map((category, index) => {
                const percentage = (Math.abs(category.value) / totalValue) * 100;
                const startAngle = (cumulativePercentage / 100) * 360;
                const endAngle = ((cumulativePercentage + percentage) / 100) * 360;
                
                const x1 = 100 + 80 * Math.cos((startAngle * Math.PI) / 180);
                const y1 = 100 + 80 * Math.sin((startAngle * Math.PI) / 180);
                const x2 = 100 + 80 * Math.cos((endAngle * Math.PI) / 180);
                const y2 = 100 + 80 * Math.sin((endAngle * Math.PI) / 180);
                
                const largeArcFlag = percentage > 50 ? 1 : 0;
                
                const pathData = [
                  `M 100 100`,
                  `L ${x1} ${y1}`,
                  `A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                  'Z'
                ].join(' ');
                
                cumulativePercentage += percentage;
                
                // Labels removed for now
                
                return (
                  <g key={index}>
                    <path
                      d={pathData}
                      fill={category.color}
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => {
                        console.log('Clicked pie segment:', category.name, 'Level:', drillDownLevel);
                        handleCategoryClick(category.name);
                      }}
                    />
                    {/* Labels removed for now */}
                  </g>
                );
              });
            })()}
          </svg>
          
          {/* Center text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-lg font-semibold">${totalValue.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2">
        {getCurrentData().map((category, index) => (
          <div
            key={index}
            className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
            onClick={() => {
              console.log('Clicked on:', category.name, 'Level:', drillDownLevel);
              handleCategoryClick(category.name);
            }}
            title={drillDownLevel === 'main' ? `Click to see ${category.name} by symbol` : drillDownLevel === 'symbol' ? `Click to see ${category.name} by date` : 'Click to drill down'}
          >
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: category.color }}
            />
            <div className="flex-1">
              <div className="text-sm font-medium">{category.name}</div>
              <div className="text-xs text-muted-foreground">
                ${Math.abs(category.value).toFixed(2)} ({((Math.abs(category.value) / totalValue) * 100).toFixed(1)}%)
              </div>
            </div>
            {drillDownLevel === 'main' && (
              <div className="text-xs text-muted-foreground">→</div>
            )}
            {drillDownLevel === 'symbol' && (
              <div className="text-xs text-muted-foreground">📅</div>
            )}
          </div>
        ))}
      </div>

      {/* Drill-down options */}
      {drillDownLevel === 'main' && (
        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
          <div className="text-sm text-blue-600 dark:text-blue-400">
            💡 Click on any category to see breakdown by symbol, then by date
          </div>
        </div>
      )}
    </div>
  );
}
