"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import TopExpensivePositions from "@/components/TopExpensivePositions";
import DailyFeeChart from "@/components/DailyFeeChart";
import InteractiveFeeBreakdown from "@/components/InteractiveFeeBreakdown";
// import VirtualizedTransactionTable from "@/components/VirtualizedTransactionTable";
import type { StatementData, BorrowPosition } from "@/app/page";
import { formatCurrency } from "@/lib/utils";
import * as XLSX from 'xlsx';

type FeeAnalysisDashboardProps = {
  statement: StatementData;
  filteredPositions?: BorrowPosition[];
};

// Helper function to calculate period from positions
function calculatePeriodFromPositions(positions: BorrowPosition[]): string {
  if (!positions || positions.length === 0) {
    return 'No data';
  }
  
  const dates = positions.map(p => p.date).filter(date => date);
  if (dates.length === 0) {
    return 'No dates';
  }
  
  const sortedDates = dates.sort();
  const startDate = sortedDates[0];
  const endDate = sortedDates[sortedDates.length - 1];
  
  // If all dates are the same, show just that date
  if (startDate === endDate) {
    return startDate;
  }
  
  // Show full date range with days
  return `${startDate} to ${endDate}`;
}

export default function FeeAnalysisDashboard({ statement, filteredPositions }: FeeAnalysisDashboardProps) {
  const { summary, totalOvernightFees, totalLocateCosts, positions } = statement;
  
  // Table filtering state - column-specific filters
  const [symbolFilter, setSymbolFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  
  // Applied filters state (what's actually being used for filtering)
  const [appliedSymbolFilter, setAppliedSymbolFilter] = useState("");
  const [appliedDateFilter, setAppliedDateFilter] = useState("");
  const [appliedTypeFilter, setAppliedTypeFilter] = useState<string>("all");
  
  // Risk analysis drill-down state
  const [riskAnalysisFilter, setRiskAnalysisFilter] = useState<{
    type: 'highCost' | 'lossPositions' | 'highFeeSymbols' | null;
    positions: BorrowPosition[];
  }>({ type: null, positions: [] });
  
  // Use filtered positions if provided, otherwise use all positions
  const displayPositions = filteredPositions || positions;
  
  // Memoized filtered positions for table display (only recalculates when applied filters change)
  const tableFilteredPositions = useMemo(() => {
    return displayPositions.filter(position => {
      const matchesSymbol = appliedSymbolFilter === "" || 
        position.symbol.toLowerCase().includes(appliedSymbolFilter.toLowerCase());
      const matchesDate = appliedDateFilter === "" || 
        position.date.includes(appliedDateFilter);
      const matchesType = appliedTypeFilter === "all" || 
        position.transactionType === appliedTypeFilter;
      return matchesSymbol && matchesDate && matchesType;
    });
  }, [displayPositions, appliedSymbolFilter, appliedDateFilter, appliedTypeFilter]);
  
  // Filter application functions
  const applyFilters = () => {
    setAppliedSymbolFilter(symbolFilter);
    setAppliedDateFilter(dateFilter);
    setAppliedTypeFilter(typeFilter);
  };

  const clearAllFilters = () => {
    setSymbolFilter("");
    setDateFilter("");
    setTypeFilter("all");
    setAppliedSymbolFilter("");
    setAppliedDateFilter("");
    setAppliedTypeFilter("all");
  };

  // Risk analysis drill-down functions
  const handleRiskAnalysisClick = (type: 'highCost' | 'lossPositions' | 'highFeeSymbols', positions: BorrowPosition[]) => {
    setRiskAnalysisFilter({ type, positions });
  };

  const clearRiskAnalysisFilter = () => {
    setRiskAnalysisFilter({ type: null, positions: [] });
  };
  
  // Calculate period based on filtered data if available
  const displayPeriod = filteredPositions 
    ? calculatePeriodFromPositions(filteredPositions)
    : statement.period;

  // Export functions
  const exportToCSV = () => {
    const filteredData = tableFilteredPositions;

    const headers = [
      'Date', 'Symbol', 'Type', 'Quantity', 'Price', 'Locate', 'Misc', 
      'Overnight', 'Commission', 'Rebate', 'Interest', 'Market Data', 'Total Fees', 'P&L'
    ];

    const csvData = filteredData.map(position => {
      const totalFees = position.overnightFee + position.locateCost + position.commissions + position.miscFees + position.interestIncome + position.marketDataFee - position.rebates;
      return [
        position.date,
        position.symbol,
        position.transactionType,
        position.quantity || '',
        position.price || '',
        formatCurrency(position.locateCost),
        formatCurrency(position.miscFees),
        formatCurrency(position.overnightFee),
        formatCurrency(position.commissions),
        formatCurrency(position.rebates),
        formatCurrency(position.interestIncome),
        formatCurrency(position.marketDataFee),
        formatCurrency(totalFees),
        formatCurrency(position.pnl || 0)
      ];
    });

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `cobra-trading-data-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToXLSX = () => {
    const filteredData = tableFilteredPositions;

    const worksheetData = filteredData.map(position => {
      const totalFees = position.overnightFee + position.locateCost + position.commissions + position.miscFees + position.interestIncome + position.marketDataFee - position.rebates;
      return {
        'Date': position.date,
        'Symbol': position.symbol,
        'Type': position.transactionType,
        'Quantity': position.quantity || '',
        'Price': position.price || '',
        'Locate': position.locateCost,
        'Misc': position.miscFees,
        'Overnight': position.overnightFee,
        'Commission': position.commissions,
        'Rebate': position.rebates,
        'Interest': position.interestIncome,
        'Market Data': position.marketDataFee,
        'Total Fees': totalFees,
        'P&L': position.pnl || 0
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Trading Data');
    
    XLSX.writeFile(workbook, `cobra-trading-data-${new Date().toISOString().split('T')[0]}.xlsx`);
  };
  
  // Calculate filtered summary data
  const filteredSummary = filteredPositions ? {
    // Interest is INCOME, not a fee, so exclude it from totalFees. Rebates reduce total fees.
    totalFees: filteredPositions.reduce((sum, p) => sum + p.overnightFee + p.locateCost + p.marketDataFee + p.otherFees + p.commissions + p.miscFees - p.rebates, 0),
    avgDailyOvernightCost: (() => {
      const totalOvernight = filteredPositions.reduce((sum, p) => sum + p.overnightFee, 0);
      const uniqueDates = new Set(filteredPositions.map(p => p.date)).size || 1;
      return totalOvernight / uniqueDates;
    })(),
    mostExpensiveSymbol: (() => {
      const symbolFees = new Map<string, number>();
      for (const pos of filteredPositions) {
        const current = symbolFees.get(pos.symbol) || 0;
        // Interest is income, so don't include it in fees. Rebates reduce fees.
        symbolFees.set(pos.symbol, current + pos.overnightFee + pos.locateCost + pos.marketDataFee + pos.otherFees + pos.commissions + pos.miscFees - pos.rebates);
      }
      let mostExpensiveSymbol = '';
      let mostExpensiveFee = 0;
      for (const [symbol, fee] of symbolFees.entries()) {
        if (fee > mostExpensiveFee) {
          mostExpensiveFee = fee;
          mostExpensiveSymbol = symbol;
        }
      }
      return mostExpensiveSymbol;
    })(),
    mostExpensiveFee: (() => {
      const symbolFees = new Map<string, number>();
      for (const pos of filteredPositions) {
        const current = symbolFees.get(pos.symbol) || 0;
        // Interest is income, so don't include it in fees. Rebates reduce fees.
        symbolFees.set(pos.symbol, current + pos.overnightFee + pos.locateCost + pos.marketDataFee + pos.otherFees + pos.commissions + pos.miscFees - pos.rebates);
      }
      let mostExpensiveFee = 0;
      for (const fee of symbolFees.values()) {
        if (fee > mostExpensiveFee) {
          mostExpensiveFee = fee;
        }
      }
      return mostExpensiveFee;
    })(),
    daysAnalyzed: new Set(filteredPositions.map(p => p.date)).size,
    totalPositions: filteredPositions.length,
    // The Amount column (N) in the statement represents NET P&L (after fees)
    // So we need to calculate Gross P&L by adding back the fees
    netPnL: filteredPositions.reduce((sum, p) => sum + (p.pnl || 0), 0),
    grossPnL: (() => {
      const netPnL = filteredPositions.reduce((sum, p) => sum + (p.pnl || 0), 0);
      const totalFees = filteredPositions.reduce((sum, p) => sum + p.overnightFee + p.locateCost + p.marketDataFee + p.otherFees + p.commissions + p.miscFees - p.rebates, 0);
      const totalRebates = filteredPositions.reduce((sum, p) => sum + p.rebates, 0);
      const totalInterest = filteredPositions.reduce((sum, p) => sum + p.interestIncome, 0);
      // Gross P&L = Net P&L + (fees - rebates - interest)
      return netPnL + (totalFees - totalRebates - totalInterest);
    })(),
    feeToProfitRatio: (() => {
      const netPnL = filteredPositions.reduce((sum, p) => sum + (p.pnl || 0), 0);
      const totalFees = filteredPositions.reduce((sum, p) => sum + p.overnightFee + p.locateCost + p.marketDataFee + p.otherFees + p.commissions + p.miscFees - p.rebates, 0);
      const totalRebates = filteredPositions.reduce((sum, p) => sum + p.rebates, 0);
      const totalInterest = filteredPositions.reduce((sum, p) => sum + p.interestIncome, 0);
      const grossPnL = netPnL + (totalFees - totalRebates - totalInterest);
      return grossPnL > 0 ? ((totalFees - totalRebates - totalInterest) / grossPnL) * 100 : 0;
    })(),
  } : {
    ...summary,
    // Override the P&L calculations for the non-filtered case
    netPnL: positions.reduce((sum, p) => sum + (p.pnl || 0), 0),
    grossPnL: (() => {
      const netPnL = positions.reduce((sum, p) => sum + (p.pnl || 0), 0);
      const totalFees = positions.reduce((sum, p) => sum + p.overnightFee + p.locateCost + p.marketDataFee + p.otherFees + p.commissions + p.miscFees - p.rebates, 0);
      const totalRebates = positions.reduce((sum, p) => sum + p.rebates, 0);
      const totalInterest = positions.reduce((sum, p) => sum + p.interestIncome, 0);
      // Gross P&L = Net P&L + (fees - rebates - interest)
      return netPnL + (totalFees - totalRebates - totalInterest);
    })(),
    feeToProfitRatio: (() => {
      const netPnL = positions.reduce((sum, p) => sum + (p.pnl || 0), 0);
      const totalFees = positions.reduce((sum, p) => sum + p.overnightFee + p.locateCost + p.marketDataFee + p.otherFees + p.commissions + p.miscFees - p.rebates, 0);
      const totalRebates = positions.reduce((sum, p) => sum + p.rebates, 0);
      const totalInterest = positions.reduce((sum, p) => sum + p.interestIncome, 0);
      const grossPnL = netPnL + (totalFees - totalRebates - totalInterest);
      return grossPnL > 0 ? ((totalFees - totalRebates - totalInterest) / grossPnL) * 100 : 0;
    })(),
  };
  
  const filteredTotalOvernightFees = filteredPositions ? 
    filteredPositions.reduce((sum, p) => sum + p.overnightFee, 0) : totalOvernightFees;
  const filteredTotalLocateCosts = filteredPositions ? 
    filteredPositions.reduce((sum, p) => sum + p.locateCost, 0) : totalLocateCosts;
  const filteredTotalCommissions = filteredPositions ? 
    filteredPositions.reduce((sum, p) => sum + p.commissions, 0) : statement.totalCommissions;
  const filteredTotalRebates = filteredPositions ? 
    filteredPositions.reduce((sum, p) => sum + p.rebates, 0) : statement.totalRebates;
  const filteredTotalMiscFees = filteredPositions ? 
    filteredPositions.reduce((sum, p) => sum + p.miscFees, 0) : statement.totalMiscFees;
  const filteredTotalInterestIncome = filteredPositions ? 
    filteredPositions.reduce((sum, p) => sum + p.interestIncome, 0) : statement.totalInterestIncome;
  const filteredTotalMarketDataFees = filteredPositions ? 
    filteredPositions.reduce((sum, p) => sum + p.marketDataFee, 0) : statement.totalMarketDataFees;
  const filteredTotalOtherFees = filteredPositions ? 
    filteredPositions.reduce((sum, p) => sum + p.otherFees, 0) : statement.totalOtherFees;

  return (
    <div className="space-y-8">
      {/* 1. Financial Performance Overview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">📊 Financial Performance Overview</h2>
          </div>
          <div className="flex gap-2">
            <a 
              href="/USER_DOCUMENTATION.md" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-1"
            >
              📖 Help
            </a>
            <a 
              href="/QUICK_START_GUIDE.md" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center gap-1"
            >
              🚀 Quick Start
            </a>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Net P&L</CardDescription>
              <CardTitle className={`text-3xl ${filteredSummary.netPnL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatCurrency(filteredSummary.netPnL)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                After fees and rebates
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Gross P&L</CardDescription>
              <CardTitle className={`text-3xl ${filteredSummary.grossPnL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatCurrency(filteredSummary.grossPnL)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Before fees and rebates
              </p>
            </CardContent>
          </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Fees</CardDescription>
            <CardTitle className="text-3xl text-red-600 dark:text-red-400">
              {formatCurrency(filteredSummary.totalFees)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
                Period: {displayPeriod}
            </p>
          </CardContent>
        </Card>
        </div>
      </div>

      {/* 2. Core Trading Costs */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">💰 Core Trading Costs</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Overnight Fees</CardDescription>
            <CardTitle className="text-3xl text-orange-600 dark:text-orange-400">
              {formatCurrency(filteredTotalOvernightFees)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <Progress 
                value={filteredSummary.totalFees > 0 ? (filteredTotalOvernightFees / filteredSummary.totalFees) * 100 : 0} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground">
                {filteredSummary.totalFees > 0 ? ((filteredTotalOvernightFees / filteredSummary.totalFees) * 100).toFixed(1) : 0}% of total
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Locate Costs</CardDescription>
            <CardTitle className="text-3xl text-yellow-600 dark:text-yellow-400">
              {formatCurrency(filteredTotalLocateCosts)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <Progress 
                value={filteredSummary.totalFees > 0 ? (filteredTotalLocateCosts / filteredSummary.totalFees) * 100 : 0} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground">
                {filteredSummary.totalFees > 0 ? ((filteredTotalLocateCosts / filteredSummary.totalFees) * 100).toFixed(1) : 0}% of total
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
              <CardDescription>Commissions</CardDescription>
            <CardTitle className="text-3xl text-blue-600 dark:text-blue-400">
                {formatCurrency(filteredTotalCommissions)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <Progress 
                  value={filteredSummary.totalFees > 0 ? (filteredTotalCommissions / filteredSummary.totalFees) * 100 : 0} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">
                  {filteredSummary.totalFees > 0 ? ((filteredTotalCommissions / filteredSummary.totalFees) * 100).toFixed(1) : 0}% of total
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 3. Daily Cost Analysis */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">📈 Daily Cost Analysis</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Avg Total Daily Cost</CardDescription>
              <CardTitle className="text-3xl text-red-600 dark:text-red-400">
                {formatCurrency(filteredSummary.totalFees / filteredSummary.daysAnalyzed)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Over {filteredSummary.daysAnalyzed} trading days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
              <CardDescription>Avg Overnight Daily Cost</CardDescription>
              <CardTitle className="text-3xl text-orange-600 dark:text-orange-400">
                {formatCurrency(filteredSummary.avgDailyOvernightCost)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
                Over {filteredSummary.daysAnalyzed} trading days
            </p>
          </CardContent>
        </Card>

            <Card>
              <CardHeader className="pb-2">
              <CardDescription>Avg Daily Locate Cost</CardDescription>
              <CardTitle className="text-3xl text-yellow-600 dark:text-yellow-400">
                {formatCurrency(filteredTotalLocateCosts / filteredSummary.daysAnalyzed)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                Over {filteredSummary.daysAnalyzed} trading days
                </p>
              </CardContent>
            </Card>
        </div>
      </div>

      {/* 4. Additional Fees & Costs */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">🔧 Additional Fees & Costs</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Trading Transactions</CardDescription>
                <CardTitle className="text-3xl text-blue-600 dark:text-blue-400">
                  {displayPositions.filter(p => p.transactionType === 'trading').length}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Buy/Sell orders
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Transactions</CardDescription>
                <CardTitle className="text-3xl text-purple-600 dark:text-purple-400">
                  {displayPositions.length}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  All types
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Rebates</CardDescription>
                <CardTitle className="text-2xl text-green-600 dark:text-green-400">
                  {formatCurrency(filteredTotalRebates)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  ECN Maker rebates (Column I)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Misc Fees</CardDescription>
                <CardTitle className="text-2xl text-amber-600 dark:text-amber-400">
                  {formatCurrency(filteredTotalMiscFees)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  TAF + CAT fees (Columns K + M)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Interest Income</CardDescription>
                <CardTitle className="text-2xl text-green-600 dark:text-green-400">
                  {formatCurrency(filteredTotalInterestIncome)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Interest earned (Column E with %)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
              <CardDescription>Market Data</CardDescription>
              <CardTitle className="text-2xl text-purple-600 dark:text-purple-400">
                {formatCurrency(filteredTotalMarketDataFees)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Market data fees
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Other Fees</CardDescription>
              <CardTitle className="text-2xl text-gray-600 dark:text-gray-400">
                {formatCurrency(filteredTotalOtherFees)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                Other miscellaneous fees
                </p>
              </CardContent>
            </Card>
        </div>
          </div>

      {filteredSummary.netPnL !== 0 && (
        <Card className="border-blue-500/50 bg-blue-50 dark:bg-blue-950/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              📊 Fee Impact Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {filteredSummary.feeToProfitRatio.toFixed(1)}%
                </p>
                <p className="text-sm text-muted-foreground">
                  Fees as % of Gross Profit
                </p>
              </div>
              <div className="text-center">
                <p className={`text-2xl font-bold ${filteredSummary.netPnL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatCurrency(filteredSummary.netPnL)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Net Profit After Fees
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {formatCurrency(filteredSummary.totalFees)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Total Fees Paid
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Most Expensive Position Alert */}
      {filteredSummary.mostExpensiveSymbol && (
        <Card className="border-red-500/50 bg-red-50 dark:bg-red-950/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              🔥 Most Expensive Position
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{filteredSummary.mostExpensiveSymbol}</p>
                <p className="text-sm text-muted-foreground">
                  Total fees for this symbol
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(filteredSummary.mostExpensiveFee)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {filteredSummary.totalFees > 0 ? ((filteredSummary.mostExpensiveFee / filteredSummary.totalFees) * 100).toFixed(1) : 0}% of total
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6">
        <TopExpensivePositions positions={displayPositions} />
      </div>

      <DailyFeeChart positions={displayPositions} />

      {/* Advanced Analytics */}
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔬 Advanced Analytics
          </CardTitle>
          <CardDescription>
            Deep dive into fee trends, symbol performance, and risk analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Trend Analysis */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">📈 Trend Analysis</h4>
              <div className="space-y-2">
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <div className="text-sm text-blue-600 dark:text-blue-400">Daily Fee Trend</div>
                  <div className="text-lg font-semibold">
                    {formatCurrency(filteredSummary.totalFees / Math.max(1, new Set(displayPositions.map(p => p.date)).size))}
                  </div>
                  <div className="text-xs text-muted-foreground">avg per trading day</div>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <div className="text-sm text-green-600 dark:text-green-400">Weekly Fee Trend</div>
                  <div className="text-lg font-semibold">
                    {formatCurrency(filteredSummary.totalFees / Math.max(1, Math.ceil(new Set(displayPositions.map(p => p.date)).size / 7)))}
                  </div>
                  <div className="text-xs text-muted-foreground">avg per week</div>
                </div>
              </div>
            </div>

            {/* Symbol Performance */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">🎯 Symbol Performance</h4>
              <div className="space-y-2">
                {(() => {
                  const symbolStats = displayPositions.reduce((acc, position) => {
                    if (!acc[position.symbol]) {
                      acc[position.symbol] = { totalFees: 0, totalPnL: 0, count: 0 };
                    }
                    acc[position.symbol].totalFees += position.overnightFee + position.locateCost + 
                      position.commissions + position.miscFees + position.interestIncome + 
                      position.marketDataFee - position.rebates;
                    acc[position.symbol].totalPnL += position.pnl || 0;
                    acc[position.symbol].count += 1;
                    return acc;
                  }, {} as Record<string, { totalFees: number; totalPnL: number; count: number }>);

                  const bestSymbol = Object.entries(symbolStats)
                    .sort(([,a], [,b]) => (b.totalPnL / Math.max(1, b.totalFees)) - (a.totalPnL / Math.max(1, a.totalFees)))[0];

                  const worstSymbol = Object.entries(symbolStats)
                    .sort(([,a], [,b]) => (a.totalPnL / Math.max(1, a.totalFees)) - (b.totalPnL / Math.max(1, b.totalFees)))[0];

                  return (
                    <>
                      {bestSymbol && (
                        <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                          <div className="text-sm text-green-600 dark:text-green-400">Best Performer</div>
                          <div className="text-lg font-semibold">{bestSymbol[0]}</div>
                          <div className="text-xs text-muted-foreground">
                            {(bestSymbol[1].totalPnL / Math.max(1, bestSymbol[1].totalFees) * 100).toFixed(1)}% efficiency
                          </div>
                        </div>
                      )}
                      {worstSymbol && worstSymbol[0] !== bestSymbol[0] && (
                        <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                          <div className="text-sm text-red-600 dark:text-red-400">Worst Performer</div>
                          <div className="text-lg font-semibold">{worstSymbol[0]}</div>
                          <div className="text-xs text-muted-foreground">
                            {(worstSymbol[1].totalPnL / Math.max(1, worstSymbol[1].totalFees) * 100).toFixed(1)}% efficiency
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Fee Efficiency Metrics */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">⚡ Fee Efficiency</h4>
              <div className="space-y-2">
                <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                  <div className="text-sm text-purple-600 dark:text-purple-400">Cost per $ Profit</div>
                  <div className="text-lg font-semibold">
                    {filteredSummary.netPnL > 0 ? formatCurrency(filteredSummary.totalFees / filteredSummary.netPnL) : 'N/A'}
                  </div>
                  <div className="text-xs text-muted-foreground">lower is better</div>
                </div>
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg">
                  <div className="text-sm text-indigo-600 dark:text-indigo-400">Profit Margin</div>
                  <div className="text-lg font-semibold">
                    {filteredSummary.totalFees > 0 ? ((filteredSummary.netPnL / (filteredSummary.netPnL + filteredSummary.totalFees)) * 100).toFixed(1) : 0}%
                  </div>
                  <div className="text-xs text-muted-foreground">after all fees</div>
                </div>
              </div>
            </div>

            {/* Risk Analysis */}
            <div className="space-y-4 md:col-span-2 lg:col-span-3">
              <div>
                <h4 className="font-semibold text-lg">⚠️ Risk Analysis</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Click on any card below to view detailed positions and transactions
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(() => {
                  const highCostPositions = displayPositions
                    .filter(p => {
                      const totalFees = p.overnightFee + p.locateCost + p.commissions + p.miscFees + p.interestIncome + p.marketDataFee - p.rebates;
                      return totalFees > 100; // Positions with fees > $100
                    })
                    .length;

                  const negativePnLCount = displayPositions.filter(p => (p.pnl || 0) < 0).length;
                  const highFeeSymbols = new Set(
                    displayPositions
                      .filter(p => {
                        const totalFees = p.overnightFee + p.locateCost + p.commissions + p.miscFees + p.interestIncome + p.marketDataFee - p.rebates;
                        return totalFees > 50;
                      })
                      .map(p => p.symbol)
                  ).size;

                  const highCostPositionsList = displayPositions.filter(p => {
                    const totalFees = p.overnightFee + p.locateCost + p.commissions + p.miscFees + p.interestIncome + p.marketDataFee - p.rebates;
                    return totalFees > 100;
                  });
                  
                  const lossPositionsList = displayPositions.filter(p => (p.pnl || 0) < 0);
                  
                  const highFeeSymbolsList = displayPositions.filter(p => {
                    const totalFees = p.overnightFee + p.locateCost + p.commissions + p.miscFees + p.interestIncome + p.marketDataFee - p.rebates;
                    return totalFees > 50;
                  });

                  return (
                    <>
                      <div 
                        className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
                        onClick={() => handleRiskAnalysisClick('highCost', highCostPositionsList)}
                        title="Click to view detailed positions"
                      >
                        <div className="text-sm text-orange-600 dark:text-orange-400">High-Cost Positions</div>
                        <div className="text-lg font-semibold">{highCostPositions}</div>
                        <div className="text-xs text-muted-foreground">fees &gt; $100</div>
                      </div>
                      <div 
                        className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                        onClick={() => handleRiskAnalysisClick('lossPositions', lossPositionsList)}
                        title="Click to view detailed positions"
                      >
                        <div className="text-sm text-red-600 dark:text-red-400">Loss Positions</div>
                        <div className="text-lg font-semibold">{negativePnLCount}</div>
                        <div className="text-xs text-muted-foreground">negative P&L</div>
                      </div>
                      <div 
                        className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
                        onClick={() => handleRiskAnalysisClick('highFeeSymbols', highFeeSymbolsList)}
                        title="Click to view detailed positions"
                      >
                        <div className="text-sm text-yellow-600 dark:text-yellow-400">High-Fee Symbols</div>
                        <div className="text-lg font-semibold">{highFeeSymbols}</div>
                        <div className="text-xs text-muted-foreground">symbols with fees &gt; $50</div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Analysis Drill-down */}
      {riskAnalysisFilter.type && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>
                🔍 {riskAnalysisFilter.type === 'highCost' ? 'High-Cost Positions' : 
                     riskAnalysisFilter.type === 'lossPositions' ? 'Loss Positions' : 
                     'High-Fee Symbols'} Details
              </span>
              <button 
                onClick={clearRiskAnalysisFilter}
                className="text-sm text-muted-foreground hover:text-foreground underline"
              >
                Close
              </button>
            </CardTitle>
            <CardDescription>
              Showing {riskAnalysisFilter.positions.length} positions matching the selected criteria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Symbol</th>
                    <th className="text-left p-2">Type</th>
                    <th className="text-right p-2">Quantity</th>
                    <th className="text-right p-2">Price</th>
                    <th className="text-right p-2">Locate</th>
                    <th className="text-right p-2">Misc</th>
                    <th className="text-right p-2">Overnight</th>
                    <th className="text-right p-2">Commission</th>
                    <th className="text-right p-2">Rebate</th>
                    <th className="text-right p-2">Interest</th>
                    <th className="text-right p-2">Market Data</th>
                    <th className="text-right p-2">Total Fees</th>
                    <th className="text-right p-2">P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {riskAnalysisFilter.positions.map((position, index) => {
                    const totalFees = position.overnightFee + position.locateCost + position.commissions + position.miscFees + position.marketDataFee - position.rebates - position.interestIncome;
                    return (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="p-2">{position.date}</td>
                        <td className="p-2 font-medium">{position.symbol}</td>
                        <td className="p-2">{position.transactionType}</td>
                        <td className="p-2 text-right">{position.quantity}</td>
                        <td className="p-2 text-right">{position.price ? `$${position.price.toFixed(2)}` : '-'}</td>
                        <td className="p-2 text-right">{formatCurrency(position.locateCost)}</td>
                        <td className="p-2 text-right">{formatCurrency(position.miscFees)}</td>
                        <td className="p-2 text-right">{formatCurrency(position.overnightFee)}</td>
                        <td className="p-2 text-right">{formatCurrency(position.commissions)}</td>
                        <td className="p-2 text-right">{formatCurrency(position.rebates)}</td>
                        <td className="p-2 text-right">{formatCurrency(position.interestIncome)}</td>
                        <td className="p-2 text-right">{formatCurrency(position.marketDataFee)}</td>
                        <td className="p-2 text-right font-medium">{formatCurrency(totalFees)}</td>
                        <td className={`p-2 text-right font-medium ${(position.pnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(position.pnl || 0)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Interactive Charts */}
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🎯 Interactive Fee Breakdown
            </CardTitle>
            <CardDescription>
              Drill down into fee categories by symbol and date
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InteractiveFeeBreakdown positions={displayPositions} />
          </CardContent>
        </Card>
      </div>


      {/* Detailed Transaction Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
          <CardTitle className="flex items-center gap-2">
            Transaction Details
            <span className="text-xs text-muted-foreground" title="Use filters above to narrow down results. Export filtered data using the buttons on the right.">
              💡 Help
            </span>
          </CardTitle>
          <CardDescription>
            Complete breakdown of all trades and fees ({tableFilteredPositions.length} / {displayPositions.length} transactions)
          </CardDescription>
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportToCSV}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-1"
              >
                📊 Export CSV
              </button>
              <button
                onClick={exportToXLSX}
                className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center gap-1"
              >
                📈 Export XLSX
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filter Controls */}
          <div className="mb-4 p-4 bg-muted/30 rounded-lg">
            <div className="grid grid-cols-3 gap-4 mb-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Date Filter</label>
                <Input
                  placeholder="Filter date..."
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Symbol Filter</label>
                <Input
                  placeholder="Filter symbol..."
                  value={symbolFilter}
                  onChange={(e) => setSymbolFilter(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Type Filter</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="h-8 text-xs w-full px-3 py-1 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="trading">Trading</option>
                  <option value="overnight">Overnight</option>
                  <option value="locate">Locate</option>
                  <option value="marketData">Market Data</option>
                  <option value="interest">Interest</option>
                </select>
              </div>
            </div>
            {/* Filter Action Buttons */}
            <div className="flex gap-2 items-center">
              <button
                onClick={applyFilters}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Apply Filters
              </button>
              <button
                onClick={clearAllFilters}
                className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Clear All
              </button>
              <div className="flex-1"></div>
              <div className="text-xs text-muted-foreground">
                Applied: {appliedDateFilter || appliedSymbolFilter || appliedTypeFilter !== "all" ? 
                  `${appliedDateFilter ? `Date:${appliedDateFilter} ` : ''}${appliedSymbolFilter ? `Symbol:${appliedSymbolFilter} ` : ''}${appliedTypeFilter !== "all" ? `Type:${appliedTypeFilter}` : ''}`.trim() : 
                  'No filters applied'}
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-semibold">Date</th>
                  <th className="text-left p-2 font-semibold">Symbol</th>
                  <th className="text-left p-2 font-semibold">Type</th>
                  <th className="text-right p-2 font-semibold">Quantity</th>
                  <th className="text-right p-2 font-semibold">Price</th>
                  <th className="text-right p-2 font-semibold">Locate</th>
                  <th className="text-right p-2 font-semibold">Misc</th>
                  <th className="text-right p-2 font-semibold">Overnight</th>
                  <th className="text-right p-2 font-semibold">Commission</th>
                  <th className="text-right p-2 font-semibold">Rebate</th>
                  <th className="text-right p-2 font-semibold">Interest</th>
                  <th className="text-right p-2 font-semibold">Market Data</th>
                  <th className="text-right p-2 font-semibold">Total Fees</th>
                  <th className="text-right p-2 font-semibold">P&L</th>
                </tr>
              </thead>
              <tbody>
                {tableFilteredPositions
                  .map((position, index) => {
                    const totalFees = position.overnightFee + position.locateCost + 
                      position.commissions + position.miscFees + position.interestIncome + 
                      position.marketDataFee - position.rebates;

                    return (
                      <tr key={`${position.symbol}-${position.date}-${index}`} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="text-left p-2">{position.date}</td>
                        <td className="text-left p-2 font-medium">{position.symbol}</td>
                        <td className="text-left p-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            position.transactionType === 'trading' 
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              : position.transactionType === 'overnight'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : position.transactionType === 'locate'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                          }`}>
                            {position.transactionType}
                          </span>
                        </td>
                        <td className="text-right p-2">{position.quantity.toLocaleString()}</td>
                        <td className="text-right p-2">
                          {position.price !== undefined ? formatCurrency(position.price) : '-'}
                        </td>
                        <td className="text-right p-2 text-yellow-600 dark:text-yellow-400">
                          {formatCurrency(position.locateCost)}
                        </td>
                        <td className="text-right p-2 text-orange-600 dark:text-orange-400">
                          {formatCurrency(position.miscFees)}
                        </td>
                        <td className="text-right p-2 text-green-600 dark:text-green-400">
                          {formatCurrency(position.overnightFee)}
                        </td>
                        <td className="text-right p-2 text-blue-600 dark:text-blue-400">
                          {formatCurrency(position.commissions)}
                        </td>
                        <td className="text-right p-2 text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(position.rebates)}
                        </td>
                        <td className="text-right p-2 text-purple-600 dark:text-purple-400">
                          {formatCurrency(position.interestIncome)}
                        </td>
                        <td className="text-right p-2 text-indigo-600 dark:text-indigo-400">
                          {formatCurrency(position.marketDataFee)}
                        </td>
                        <td className="text-right p-2 font-semibold">
                          {formatCurrency(totalFees)}
                        </td>
                        <td className={`text-right p-2 font-semibold ${
                          (position.pnl || 0) >= 0 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {position.pnl !== undefined && position.pnl !== null ? formatCurrency(position.pnl) : '-'}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 font-bold">
                  <td colSpan={5} className="p-2 text-right">TOTALS:</td>
                  <td className="p-2 text-right text-yellow-600 dark:text-yellow-400">
                    {formatCurrency(filteredTotalLocateCosts)}
                  </td>
                  <td className="p-2 text-right text-orange-600 dark:text-orange-400">
                    {formatCurrency(filteredTotalMiscFees)}
                  </td>
                  <td className="p-2 text-right text-green-600 dark:text-green-400">
                    {formatCurrency(filteredTotalOvernightFees)}
                  </td>
                  <td className="p-2 text-right text-blue-600 dark:text-blue-400">
                    {formatCurrency(filteredTotalCommissions)}
                  </td>
                  <td className="p-2 text-right text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(filteredTotalRebates)}
                  </td>
                  <td className="p-2 text-right text-purple-600 dark:text-purple-400">
                    {formatCurrency(filteredTotalInterestIncome)}
                  </td>
                  <td className="p-2 text-right text-indigo-600 dark:text-indigo-400">
                    {formatCurrency(filteredTotalMarketDataFees)}
                  </td>
                  <td className="p-2 text-right text-red-600 dark:text-red-400">
                    {formatCurrency(filteredSummary.totalFees)}
                  </td>
                  <td className={`p-2 text-right ${
                    filteredSummary.netPnL >= 0 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {formatCurrency(filteredSummary.netPnL)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}