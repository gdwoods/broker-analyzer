"use client";

import { useState, useCallback, useMemo } from "react";
import FileUpload from "@/components/FileUpload";
import DateRangeSlider from "@/components/DateRangeSlider";
import TickerFilter from "@/components/TickerFilter";
import FeeAnalysisDashboard from "@/components/FeeAnalysisDashboard";
import HistoricalComparison from "@/components/HistoricalComparison";

export type StatementData = {
      fileName: string;
      uploadDate: Date;
      period: string;
      totalOvernightFees: number;
      totalLocateCosts: number;
      totalMarketDataFees: number;
      totalInterestFees: number;
      totalOtherFees: number;
      totalCommissions: number;
      totalRebates: number;
      totalMiscFees: number;
      positions: BorrowPosition[];
  summary: FeeSummary;
};

export type BorrowPosition = {
  symbol: string;
  date: string;
  quantity: number;
  overnightFee: number;
  locateCost: number;
  marketDataFee: number;
  interestFee: number;
  otherFees: number;
  commissions: number; // Column P - Commissions
  rebates: number; // Column I - ECNMaker (rebates)
  miscFees: number; // Column K + M - TAFFee + CATFee
  borrowRate: number;
  value: number;
  pnl?: number; // Profit & Loss for this position
  transactionType: 'overnight' | 'locate' | 'marketData' | 'interest' | 'trading'; // Type of transaction
  buySell?: string; // Buy or Sell
  price?: number; // Price per share
};

export type FeeSummary = {
  totalFees: number;
  avgDailyOvernightCost: number;
  mostExpensiveSymbol: string;
  mostExpensiveFee: number;
  daysAnalyzed: number;
  totalPositions: number;
  totalPnL: number;
  netPnL: number; // P&L after fees
  feeToProfitRatio: number; // Fees as percentage of gross profit
};

export default function Page() {
  const [statements, setStatements] = useState<StatementData[]>([]);
  const [currentStatement, setCurrentStatement] = useState<StatementData | null>(null);
  const [dateFilteredPositions, setDateFilteredPositions] = useState<BorrowPosition[]>([]);
  const [tickerFilteredPositions, setTickerFilteredPositions] = useState<BorrowPosition[]>([]);

  // Combine both filters to get final filtered positions
  const finalFilteredPositions = useMemo(() => {
    if (!currentStatement) return [];
    
    // Start with all positions
    let positions = currentStatement.positions;
    
    // Apply date filter if active
    if (dateFilteredPositions.length > 0) {
      positions = dateFilteredPositions;
    }
    
    // Apply ticker filter if active
    if (tickerFilteredPositions.length > 0) {
      // Combine ticker filter with current positions
      const tickerSymbols = new Set(tickerFilteredPositions.map(p => p.symbol));
      positions = positions.filter(pos => tickerSymbols.has(pos.symbol));
    }
    
    console.log(`🔍 Final filtered positions: ${positions.length} positions`);
    console.log(`🔍 Sample positions:`, positions.slice(0, 3).map(p => `${p.symbol} (${p.date}): P&L=${p.pnl}, Fees=${p.overnightFee + p.locateCost}`));
    
    return positions;
  }, [currentStatement, dateFilteredPositions, tickerFilteredPositions]);

  const handleStatementParsed = (data: StatementData) => {
    setCurrentStatement(data);
    setStatements((prev) => [...prev, data]);
    // Initialize filtered positions with all positions from the new statement
    setDateFilteredPositions([]);
    setTickerFilteredPositions([]);
  };

  const handleDateRangeChange = useCallback((positions: BorrowPosition[]) => {
    setDateFilteredPositions(positions);
  }, []);

  const handleTickerFilterChange = useCallback((positions: BorrowPosition[]) => {
    setTickerFilteredPositions(positions);
  }, []);

  const handleClearData = () => {
    setCurrentStatement(null);
    setStatements([]);
    setDateFilteredPositions([]);
    setTickerFilteredPositions([]);
  };

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            🐍 Cobra Fee Analyzer
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Analyze borrow fees, locate costs, and trading patterns from your Cobra statements
          </p>
        </div>
        
        <div className="flex gap-2">
          {statements.length > 0 && (
            <button
              onClick={handleClearData}
              className="px-4 py-2 border border-destructive text-destructive rounded hover:bg-destructive hover:text-destructive-foreground transition-colors"
            >
              Clear All Data
            </button>
          )}
          <button
            onClick={() => document.documentElement.classList.toggle("dark")}
            className="px-4 py-2 border rounded hover:bg-accent transition-colors"
          >
            🌓 Toggle Dark Mode
          </button>
        </div>
      </div>

      {/* File Upload Section */}
      <FileUpload onStatementParsed={handleStatementParsed} />

      {/* Filters */}
      {currentStatement && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DateRangeSlider 
            positions={currentStatement.positions}
            onDateRangeChange={handleDateRangeChange}
          />
          <TickerFilter 
            positions={currentStatement.positions}
            onTickerFilterChange={handleTickerFilterChange}
          />
        </div>
      )}

      {/* Current Statement Analysis */}
      {currentStatement && (
        <FeeAnalysisDashboard 
          statement={currentStatement} 
          filteredPositions={finalFilteredPositions}
        />
      )}

      {/* Historical Comparison */}
      {statements.length > 1 && (
        <HistoricalComparison statements={statements} />
      )}
    </div>
  );
}


