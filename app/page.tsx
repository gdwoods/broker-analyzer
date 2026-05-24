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
      totalInterestIncome: number;
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
  interestIncome: number;
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
  const [isDataProcessing, setIsDataProcessing] = useState(false);

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
    setIsDataProcessing(true);
    setCurrentStatement(data);
    setStatements((prev) => [...prev, data]);
    // Initialize filtered positions with all positions from the new statement
    setDateFilteredPositions([]);
    setTickerFilteredPositions([]);
    
    // Simulate processing time for UI feedback
    setTimeout(() => {
      setIsDataProcessing(false);
    }, 500);
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
          <div className="mt-2 p-2 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md">
            <p className="text-xs text-green-700 dark:text-green-400 flex items-center gap-1">
              🔒 <strong>Your data is safe:</strong> No data leaves your browser. All processing happens locally on your device.
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {statements.length > 0 && (
            <button
              onClick={handleClearData}
              className="px-4 py-2 border border-red-500 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 rounded hover:bg-red-100 dark:hover:bg-red-950/40 transition-colors"
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

      {/* Documentation Links */}
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-blue-600 dark:text-blue-400 font-semibold">📚 Need Help?</span>
            <span className="text-sm text-muted-foreground">Access user guides and documentation:</span>
          </div>
          <div className="flex gap-2">
            <a 
              href="/USER_DOCUMENTATION.md" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              📖 Full Documentation
            </a>
            <a 
              href="/QUICK_START_GUIDE.md" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              🚀 Quick Start
            </a>
            <a 
              href="/FEATURE_OVERVIEW.md" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
            >
              📊 Features
            </a>
          </div>
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
        <div className="relative">
          {isDataProcessing && (
            <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
              <div className="flex flex-col items-center gap-4 p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg border">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Preparing dashboard...
                </p>
              </div>
            </div>
          )}
          <FeeAnalysisDashboard 
            statement={currentStatement} 
            filteredPositions={finalFilteredPositions}
          />
        </div>
      )}

      {/* Historical Comparison */}
      {statements.length > 1 && (
        <HistoricalComparison statements={statements} />
      )}
    </div>
  );
}


