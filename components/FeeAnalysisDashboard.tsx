"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import FeeBreakdownChart from "@/components/FeeBreakdownChart";
import TopExpensivePositions from "@/components/TopExpensivePositions";
import DailyFeeChart from "@/components/DailyFeeChart";
import type { StatementData, BorrowPosition } from "@/app/page";
import { formatCurrency } from "@/lib/utils";

type FeeAnalysisDashboardProps = {
  statement: StatementData;
  filteredPositions?: BorrowPosition[];
};

export default function FeeAnalysisDashboard({ statement, filteredPositions }: FeeAnalysisDashboardProps) {
  const { summary, totalOvernightFees, totalLocateCosts, positions } = statement;
  
  // Table filtering state - column-specific filters
  const [symbolFilter, setSymbolFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  
  // Use filtered positions if provided, otherwise use all positions
  const displayPositions = filteredPositions || positions;
  
  // Calculate filtered summary data
  const filteredSummary = filteredPositions ? {
    // Interest is INCOME, not a fee, so exclude it from totalFees
    totalFees: filteredPositions.reduce((sum, p) => sum + p.overnightFee + p.locateCost + p.marketDataFee + p.otherFees + p.commissions + p.miscFees, 0),
    avgDailyOvernightCost: (() => {
      const totalOvernight = filteredPositions.reduce((sum, p) => sum + p.overnightFee, 0);
      const uniqueDates = new Set(filteredPositions.map(p => p.date)).size || 1;
      return totalOvernight / uniqueDates;
    })(),
    mostExpensiveSymbol: (() => {
      const symbolFees = new Map<string, number>();
      for (const pos of filteredPositions) {
        const current = symbolFees.get(pos.symbol) || 0;
        // Interest is income, so don't include it in fees
        symbolFees.set(pos.symbol, current + pos.overnightFee + pos.locateCost + pos.marketDataFee + pos.otherFees + pos.commissions + pos.miscFees);
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
        // Interest is income, so don't include it in fees
        symbolFees.set(pos.symbol, current + pos.overnightFee + pos.locateCost + pos.marketDataFee + pos.otherFees + pos.commissions + pos.miscFees);
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
    totalPnL: filteredPositions.reduce((sum, p) => sum + (p.pnl || 0), 0),
    netPnL: (() => {
      const totalPnL = filteredPositions.reduce((sum, p) => sum + (p.pnl || 0), 0);
      const totalFees = filteredPositions.reduce((sum, p) => sum + p.overnightFee + p.locateCost + p.marketDataFee + p.otherFees + p.commissions + p.miscFees, 0);
      const totalRebates = filteredPositions.reduce((sum, p) => sum + p.rebates, 0);
      const totalInterest = filteredPositions.reduce((sum, p) => sum + p.interestFee, 0);
      // Net fees = fees - rebates - interest (both rebates and interest are income)
      return totalPnL - (totalFees - totalRebates - totalInterest);
    })(),
    feeToProfitRatio: (() => {
      const totalPnL = filteredPositions.reduce((sum, p) => sum + (p.pnl || 0), 0);
      const totalFees = filteredPositions.reduce((sum, p) => sum + p.overnightFee + p.locateCost + p.marketDataFee + p.otherFees + p.commissions + p.miscFees, 0);
      const totalRebates = filteredPositions.reduce((sum, p) => sum + p.rebates, 0);
      const totalInterest = filteredPositions.reduce((sum, p) => sum + p.interestFee, 0);
      return totalPnL > 0 ? ((totalFees - totalRebates - totalInterest) / totalPnL) * 100 : 0;
    })(),
  } : summary;
  
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
  const filteredTotalInterestFees = filteredPositions ? 
    filteredPositions.reduce((sum, p) => sum + p.interestFee, 0) : statement.totalInterestFees;
  const filteredTotalMarketDataFees = filteredPositions ? 
    filteredPositions.reduce((sum, p) => sum + p.marketDataFee, 0) : statement.totalMarketDataFees;

  return (
    <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-8 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Fees</CardDescription>
            <CardTitle className="text-3xl text-red-600 dark:text-red-400">
              {formatCurrency(filteredSummary.totalFees)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Period: {statement.period}
            </p>
          </CardContent>
        </Card>

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
            <CardDescription>Avg Daily Cost</CardDescription>
            <CardTitle className="text-3xl text-blue-600 dark:text-blue-400">
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
            <CardDescription>Gross P&L</CardDescription>
            <CardTitle className={`text-3xl ${filteredSummary.totalPnL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(filteredSummary.totalPnL)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Before fees
            </p>
          </CardContent>
        </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Net P&L</CardDescription>
                <CardTitle className={`text-3xl ${filteredSummary.netPnL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatCurrency(filteredSummary.netPnL)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  After fees
                </p>
              </CardContent>
            </Card>

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
          </div>

          {/* Additional Fee Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Commissions</CardDescription>
                <CardTitle className="text-2xl text-orange-600 dark:text-orange-400">
                  {formatCurrency(filteredTotalCommissions)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Trading commissions (Column P)
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
                  {formatCurrency(filteredTotalInterestFees)}
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
                <CardDescription>Net Fees</CardDescription>
                <CardTitle className="text-2xl text-red-600 dark:text-red-400">
                  {formatCurrency(filteredSummary.totalFees - filteredTotalRebates - filteredTotalInterestFees)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Fees after rebates & interest
                </p>
              </CardContent>
            </Card>
          </div>

      {/* P&L vs Fees Analysis */}
      {filteredSummary.totalPnL !== 0 && (
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FeeBreakdownChart statement={statement} />
        <TopExpensivePositions positions={displayPositions} />
      </div>

      <DailyFeeChart positions={displayPositions} />

      {/* Detailed Transaction Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction Details</CardTitle>
          <CardDescription>
            Complete breakdown of all trades and fees ({displayPositions.filter(position => {
              const matchesSymbol = symbolFilter === "" || position.symbol.toLowerCase().includes(symbolFilter.toLowerCase());
              const matchesDate = dateFilter === "" || position.date.includes(dateFilter);
              const matchesType = typeFilter === "all" || position.transactionType === typeFilter;
              return matchesSymbol && matchesDate && matchesType;
            }).length} / {displayPositions.length} transactions)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-semibold">Date</th>
                  <th className="text-left p-2 font-semibold">Symbol</th>
                  <th className="text-left p-2 font-semibold">Type</th>
                  <th className="text-right p-2 font-semibold">Quantity</th>
                  <th className="text-right p-2 font-semibold">Price</th>
                  <th className="text-right p-2 font-semibold">P&L</th>
                  <th className="text-right p-2 font-semibold">Overnight</th>
                  <th className="text-right p-2 font-semibold">Locate</th>
                  <th className="text-right p-2 font-semibold">Commission</th>
                  <th className="text-right p-2 font-semibold">Rebate</th>
                  <th className="text-right p-2 font-semibold">Interest</th>
                  <th className="text-right p-2 font-semibold">Market Data</th>
                  <th className="text-right p-2 font-semibold">Misc</th>
                  <th className="text-right p-2 font-semibold">Total Fees</th>
                </tr>
                {/* Filter Row */}
                <tr className="border-b bg-muted/30">
                  <th className="p-1">
                    <Input
                      placeholder="Filter..."
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </th>
                  <th className="p-1">
                    <Input
                      placeholder="Filter..."
                      value={symbolFilter}
                      onChange={(e) => setSymbolFilter(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </th>
                  <th className="p-1">
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="h-8 w-full px-2 text-xs rounded-md border border-input bg-background"
                    >
                      <option value="all">All</option>
                      <option value="trading">Trading</option>
                      <option value="overnight">Overnight</option>
                      <option value="locate">Locate</option>
                      <option value="interest">Interest</option>
                      <option value="marketData">Market Data</option>
                    </select>
                  </th>
                  <th colSpan={11} className="p-1 text-center text-xs text-muted-foreground">
                    {(symbolFilter || dateFilter || typeFilter !== "all") && (
                      <button
                        onClick={() => {
                          setSymbolFilter("");
                          setDateFilter("");
                          setTypeFilter("all");
                        }}
                        className="text-blue-600 hover:underline"
                      >
                        Clear filters
                      </button>
                    )}
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayPositions
                  .filter(position => {
                    // Apply column-specific filters
                    const matchesSymbol = symbolFilter === "" || 
                      position.symbol.toLowerCase().includes(symbolFilter.toLowerCase());
                    
                    const matchesDate = dateFilter === "" || 
                      position.date.includes(dateFilter);
                    
                    const matchesType = typeFilter === "all" || 
                      position.transactionType === typeFilter;
                    
                    return matchesSymbol && matchesDate && matchesType;
                  })
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((position, index) => {
                    const totalFees = position.overnightFee + position.locateCost + position.commissions + position.miscFees + position.interestFee + position.marketDataFee;
                    return (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="p-2 text-muted-foreground">{position.date}</td>
                        <td className="p-2 font-medium">{position.symbol}</td>
                        <td className="p-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            position.transactionType === 'trading' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                            position.transactionType === 'overnight' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                            position.transactionType === 'locate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                            position.transactionType === 'interest' ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200' :
                            'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                          }`}>
                            {position.transactionType}
                          </span>
                        </td>
                        <td className="p-2 text-right text-muted-foreground">
                          {position.quantity !== 0 ? position.quantity.toLocaleString() : '-'}
                        </td>
                        <td className="p-2 text-right text-muted-foreground">
                          {position.price ? formatCurrency(position.price) : '-'}
                        </td>
                        <td className={`p-2 text-right font-medium ${
                          (position.pnl || 0) > 0 ? 'text-green-600 dark:text-green-400' :
                          (position.pnl || 0) < 0 ? 'text-red-600 dark:text-red-400' :
                          'text-muted-foreground'
                        }`}>
                          {position.pnl ? formatCurrency(position.pnl) : '-'}
                        </td>
                        <td className="p-2 text-right text-orange-600 dark:text-orange-400">
                          {position.overnightFee > 0 ? formatCurrency(position.overnightFee) : '-'}
                        </td>
                        <td className="p-2 text-right text-yellow-600 dark:text-yellow-400">
                          {position.locateCost > 0 ? formatCurrency(position.locateCost) : '-'}
                        </td>
                        <td className="p-2 text-right text-purple-600 dark:text-purple-400">
                          {position.commissions > 0 ? formatCurrency(position.commissions) : '-'}
                        </td>
                        <td className="p-2 text-right text-green-600 dark:text-green-400">
                          {position.rebates > 0 ? formatCurrency(position.rebates) : '-'}
                        </td>
                        <td className="p-2 text-right text-green-600 dark:text-green-400 font-medium">
                          {position.interestFee > 0 ? `+${formatCurrency(position.interestFee)}` : '-'}
                        </td>
                        <td className="p-2 text-right text-purple-600 dark:text-purple-400">
                          {position.marketDataFee > 0 ? formatCurrency(position.marketDataFee) : '-'}
                        </td>
                        <td className="p-2 text-right text-amber-600 dark:text-amber-400">
                          {position.miscFees > 0 ? formatCurrency(position.miscFees) : '-'}
                        </td>
                        <td className="p-2 text-right font-semibold text-red-600 dark:text-red-400">
                          {totalFees > 0 ? formatCurrency(totalFees) : '-'}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 font-bold">
                  <td colSpan={5} className="p-2 text-right">TOTALS:</td>
                  <td className={`p-2 text-right ${
                    filteredSummary.totalPnL > 0 ? 'text-green-600 dark:text-green-400' :
                    filteredSummary.totalPnL < 0 ? 'text-red-600 dark:text-red-400' :
                    ''
                  }`}>
                    {formatCurrency(filteredSummary.totalPnL)}
                  </td>
                  <td className="p-2 text-right text-orange-600 dark:text-orange-400">
                    {formatCurrency(filteredTotalOvernightFees)}
                  </td>
                  <td className="p-2 text-right text-yellow-600 dark:text-yellow-400">
                    {formatCurrency(filteredTotalLocateCosts)}
                  </td>
                  <td className="p-2 text-right text-purple-600 dark:text-purple-400">
                    {formatCurrency(filteredTotalCommissions)}
                  </td>
                  <td className="p-2 text-right text-green-600 dark:text-green-400">
                    {formatCurrency(filteredTotalRebates)}
                  </td>
                  <td className="p-2 text-right text-green-600 dark:text-green-400 font-bold">
                    +{formatCurrency(filteredTotalInterestFees)}
                  </td>
                  <td className="p-2 text-right text-purple-600 dark:text-purple-400">
                    {formatCurrency(filteredTotalMarketDataFees)}
                  </td>
                  <td className="p-2 text-right text-amber-600 dark:text-amber-400">
                    {formatCurrency(filteredTotalMiscFees)}
                  </td>
                  <td className="p-2 text-right text-red-600 dark:text-red-400">
                    {formatCurrency(filteredSummary.totalFees)}
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

