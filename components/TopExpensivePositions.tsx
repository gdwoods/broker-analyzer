"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { BorrowPosition } from "@/app/page";
import { formatCurrency } from "@/lib/utils";

type TopExpensivePositionsProps = {
  positions: BorrowPosition[];
};

export default function TopExpensivePositions({ positions }: TopExpensivePositionsProps) {
  const [expandedSymbols, setExpandedSymbols] = useState<Set<string>>(new Set());

  // Group by symbol and sum fees + P&L
  const symbolData = new Map<string, {
    totalFee: number;
    totalPnL: number;
    overnightFee: number;
    locateCost: number;
    commissions: number;
    rebates: number;
    miscFees: number;
    count: number;
    tradingCount: number;
    entries: Array<{
      date: string;
      overnightFee: number;
      locateCost: number;
      commissions: number;
      rebates: number;
      miscFees: number;
      totalFee: number;
      pnl?: number;
      transactionType: string;
      buySell?: string;
      price?: number;
    }>;
  }>();

  for (const pos of positions) {
    const existing = symbolData.get(pos.symbol) || {
      totalFee: 0,
      totalPnL: 0,
      overnightFee: 0,
      locateCost: 0,
      commissions: 0,
      rebates: 0,
      miscFees: 0,
      count: 0,
      tradingCount: 0,
      entries: []
    };

    const entryFee = Math.round((pos.overnightFee + pos.locateCost + pos.commissions + pos.miscFees) * 100) / 100;

    symbolData.set(pos.symbol, {
      totalFee: Math.round((existing.totalFee + pos.overnightFee + pos.locateCost + pos.commissions + pos.miscFees) * 100) / 100,
      totalPnL: Math.round((existing.totalPnL + (pos.pnl || 0)) * 100) / 100,
      overnightFee: Math.round((existing.overnightFee + pos.overnightFee) * 100) / 100,
      locateCost: Math.round((existing.locateCost + pos.locateCost) * 100) / 100,
      commissions: Math.round((existing.commissions + pos.commissions) * 100) / 100,
      rebates: Math.round((existing.rebates + pos.rebates) * 100) / 100,
      miscFees: Math.round((existing.miscFees + pos.miscFees) * 100) / 100,
      count: existing.count + 1,
      tradingCount: existing.tradingCount + (pos.transactionType === 'trading' ? 1 : 0),
      entries: [
        ...existing.entries,
        {
          date: pos.date,
          overnightFee: Math.round(pos.overnightFee * 100) / 100,
          locateCost: Math.round(pos.locateCost * 100) / 100,
          commissions: Math.round(pos.commissions * 100) / 100,
          rebates: Math.round(pos.rebates * 100) / 100,
          miscFees: Math.round(pos.miscFees * 100) / 100,
          totalFee: entryFee,
          pnl: pos.pnl,
          transactionType: pos.transactionType,
          buySell: pos.buySell,
          price: pos.price
        }
      ]
    });
  }

  // Convert to array and sort by total fee (or total P&L if no fees)
  const sortedSymbols = Array.from(symbolData.entries())
    .map(([symbol, data]) => ({ symbol, ...data }))
    .sort((a, b) => {
      // Sort by total fees first, then by absolute P&L if fees are equal
      if (Math.abs(b.totalFee - a.totalFee) > 0.01) {
        return b.totalFee - a.totalFee;
      }
      return Math.abs(b.totalPnL) - Math.abs(a.totalPnL);
    })
    .slice(0, 10);

  const toggleExpanded = (symbol: string) => {
    const newExpanded = new Set(expandedSymbols);
    if (newExpanded.has(symbol)) {
      newExpanded.delete(symbol);
    } else {
      newExpanded.add(symbol);
    }
    setExpandedSymbols(newExpanded);
  };

  return (
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Most Active Symbols</CardTitle>
            <CardDescription>Symbols with highest fees and trading activity</CardDescription>
          </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedSymbols.map((item, index) => {
            const isExpanded = expandedSymbols.has(item.symbol);
            
            return (
              <div key={item.symbol}>
                <div 
                  className="flex items-center justify-between p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleExpanded(item.symbol)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                      {index + 1}
                    </div>
                        <div>
                          <p className="font-semibold">{item.symbol}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.count} {item.count === 1 ? 'entry' : 'entries'}
                            {item.tradingCount > 0 && ` • ${item.tradingCount} trades`}
                          </p>
                        </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end w-[18rem]">
                      <div className="text-right">
                        <p className="font-bold text-red-600 dark:text-red-400">
                          Fees: {formatCurrency(item.totalFee)}
                        </p>
                        {item.totalPnL !== 0 && (
                          <p className={`font-bold text-sm ${item.totalPnL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            P&L: {formatCurrency(item.totalPnL)}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1 w-full">
                        <p className="text-xs text-muted-foreground">
                          O: {formatCurrency(item.overnightFee)} | L: {formatCurrency(item.locateCost)}
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 rounded-full h-2 overflow-hidden flex">
                            {item.totalFee > 0 ? (
                              <>
                                <div 
                                  className="bg-orange-500 transition-all duration-300"
                                  style={{ 
                                    width: `${(item.overnightFee / item.totalFee) * 100}%` 
                                  }}
                                />
                                <div 
                                  className="bg-yellow-500 transition-all duration-300"
                                  style={{ 
                                    width: `${(item.locateCost / item.totalFee) * 100}%` 
                                  }}
                                />
                              </>
                            ) : (
                              <div className="w-full bg-muted" />
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground min-w-[3rem] text-right">
                            <div className="text-right">O: {item.totalFee > 0 ? Math.round((item.overnightFee / item.totalFee) * 100) : 0}%</div>
                            <div className="text-right">L: {item.totalFee > 0 ? Math.round((item.locateCost / item.totalFee) * 100) : 0}%</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="w-8 flex justify-center">
                      {item.count > 1 && (
                        <Button variant="ghost" size="sm" className="p-1">
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                
                {isExpanded && item.entries.length > 1 && (
                  <div className="mt-2 ml-11 space-y-1 border-l-2 border-muted pl-3">
                    {item.entries
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((entry, entryIndex) => (
                        <div key={entryIndex} className="flex justify-between items-center py-1 px-2 bg-muted/30 rounded text-sm">
                          <div>
                            <span className="font-medium">
                              {new Date(entry.date).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </span>
                          </div>
                          <div className="flex flex-col items-end w-[18rem]">
                            {entry.transactionType === 'trading' ? (
                              <span className={`font-medium ${(entry.pnl || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                P&L: {formatCurrency(entry.pnl || 0)}
                              </span>
                            ) : (
                              <span className="font-medium">{formatCurrency(entry.totalFee)}</span>
                            )}
                            <div className="space-y-1 w-full">
                              {entry.transactionType === 'trading' ? (
                                <span className="text-xs text-blue-600 dark:text-blue-400">
                                  {entry.buySell} @ ${entry.price || 0}
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  O: {formatCurrency(entry.overnightFee)} | L: {formatCurrency(entry.locateCost)}
                                </span>
                              )}
                              <div className="flex items-center gap-2">
                                <div className="flex-1 rounded-full h-1.5 overflow-hidden flex">
                                  {entry.totalFee > 0 ? (
                                    <>
                                      <div 
                                        className="bg-orange-500 transition-all duration-300"
                                        style={{ 
                                          width: `${(entry.overnightFee / entry.totalFee) * 100}%` 
                                        }}
                                      />
                                      <div 
                                        className="bg-yellow-500 transition-all duration-300"
                                        style={{ 
                                          width: `${(entry.locateCost / entry.totalFee) * 100}%` 
                                        }}
                                      />
                                    </>
                                  ) : (
                                    <div className="w-full bg-muted/50" />
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground min-w-[2.5rem] text-right">
                                  <div className="text-right">O: {entry.totalFee > 0 ? Math.round((entry.overnightFee / entry.totalFee) * 100) : 0}%</div>
                                  <div className="text-right">L: {entry.totalFee > 0 ? Math.round((entry.locateCost / entry.totalFee) * 100) : 0}%</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}


