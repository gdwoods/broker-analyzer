"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Search } from "lucide-react";
import type { BorrowPosition } from "@/app/page";

type TickerFilterProps = {
  positions: BorrowPosition[];
  onTickerFilterChange: (filteredPositions: BorrowPosition[]) => void;
};

export default function TickerFilter({ positions, onTickerFilterChange }: TickerFilterProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTickers, setSelectedTickers] = useState<Set<string>>(new Set());

  // Get unique tickers from positions
  const availableTickers = useMemo(() => {
    const tickers = new Set(positions.map(p => p.symbol));
    return Array.from(tickers).sort();
  }, [positions]);

  // Filter tickers based on search term
  const filteredTickers = useMemo(() => {
    if (!searchTerm.trim()) return availableTickers;
    return availableTickers.filter(ticker => 
      ticker.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [availableTickers, searchTerm]);

  const handleTickerToggle = (ticker: string) => {
    const newSelected = new Set(selectedTickers);
    if (newSelected.has(ticker)) {
      newSelected.delete(ticker);
    } else {
      newSelected.add(ticker);
    }
    setSelectedTickers(newSelected);
    
    // Apply filter
    const filteredPositions = newSelected.size === 0 
      ? positions 
      : positions.filter(p => newSelected.has(p.symbol));
    
    onTickerFilterChange(filteredPositions);
  };

  const handleClearAll = () => {
    setSelectedTickers(new Set());
    setSearchTerm("");
    onTickerFilterChange(positions);
  };

  const handleSelectAll = () => {
    setSelectedTickers(new Set(availableTickers));
    onTickerFilterChange(positions);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          🎯 Ticker Filter
        </CardTitle>
        <CardDescription>
          Filter data by specific stock symbols
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search tickers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              disabled={selectedTickers.size === availableTickers.length}
            >
              Select All ({availableTickers.length})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              disabled={selectedTickers.size === 0}
            >
              Clear All
            </Button>
          </div>

          {/* Selected Tickers */}
          {selectedTickers.size > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Selected ({selectedTickers.size}):
              </p>
              <div className="flex flex-wrap gap-2">
                {Array.from(selectedTickers).map(ticker => (
                  <div
                    key={ticker}
                    className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-sm"
                  >
                    <span>{ticker}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-primary/20"
                      onClick={() => handleTickerToggle(ticker)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ticker List */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Available Tickers:
            </p>
            <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-1">
              {filteredTickers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No tickers found
                </p>
              ) : (
                filteredTickers.map(ticker => {
                  const isSelected = selectedTickers.has(ticker);
                  const tickerPositions = positions.filter(p => p.symbol === ticker);
                  const totalFees = tickerPositions.reduce((sum, p) => 
                    sum + p.overnightFee + p.locateCost + p.marketDataFee + p.interestFee + p.otherFees, 0
                  );
                  
                  return (
                    <div
                      key={ticker}
                      className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                        isSelected 
                          ? 'bg-primary text-primary-foreground' 
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => handleTickerToggle(ticker)}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleTickerToggle(ticker)}
                          className="rounded"
                        />
                        <span className="font-medium">{ticker}</span>
                      </div>
                      <div className="text-right text-sm">
                        <div className="font-medium">
                          ${totalFees.toFixed(2)}
                        </div>
                        <div className="text-muted-foreground">
                          {tickerPositions.length} {tickerPositions.length === 1 ? 'entry' : 'entries'}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="pt-2 border-t">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                Showing: {selectedTickers.size === 0 ? availableTickers.length : selectedTickers.size} tickers
              </span>
              <span>
                Total positions: {selectedTickers.size === 0 ? positions.length : positions.filter(p => selectedTickers.has(p.symbol)).length}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
