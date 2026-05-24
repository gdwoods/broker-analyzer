"use client";

import { useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';
import type { BorrowPosition } from '@/app/page';

type VirtualizedTransactionTableProps = {
  positions: BorrowPosition[];
  symbolFilter: string;
  dateFilter: string;
  typeFilter: string;
  formatCurrency: (amount: number) => string;
  filteredTotalLocateCosts: number;
  filteredTotalMiscFees: number;
  filteredTotalOvernightFees: number;
  filteredTotalCommissions: number;
  filteredTotalRebates: number;
  filteredTotalInterestFees: number;
  filteredTotalMarketDataFees: number;
  filteredTotalFees: number;
  filteredSummary: {
    netPnL: number;
  };
};

export default function VirtualizedTransactionTable({
  positions,
  symbolFilter,
  dateFilter,
  typeFilter,
  formatCurrency,
  filteredTotalLocateCosts,
  filteredTotalMiscFees,
  filteredTotalOvernightFees,
  filteredTotalCommissions,
  filteredTotalRebates,
  filteredTotalInterestFees,
  filteredTotalMarketDataFees,
  filteredTotalFees,
  filteredSummary
}: VirtualizedTransactionTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Filter positions based on current filters
  const filteredPositions = useMemo(() => {
    return positions.filter(position => {
      const matchesSymbol = symbolFilter === "" || 
        position.symbol.toLowerCase().includes(symbolFilter.toLowerCase());
      const matchesDate = dateFilter === "" || 
        position.date.includes(dateFilter);
      const matchesType = typeFilter === "all" || 
        position.transactionType === typeFilter;
      return matchesSymbol && matchesDate && matchesType;
    });
  }, [positions, symbolFilter, dateFilter, typeFilter]);

  const virtualizer = useVirtualizer({
    count: filteredPositions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50, // Estimated row height
    overscan: 10, // Number of items to render outside visible area
  });

  const totalHeight = virtualizer.getTotalSize();
  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-white dark:bg-gray-900 z-10">
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
          <tr>
            <td colSpan={14} style={{ height: `${totalHeight}px` }}>
              <div
                ref={parentRef}
                className="relative overflow-auto"
                style={{ height: '400px' }} // Fixed height for the virtualized container
              >
                <div
                  style={{
                    height: `${totalHeight}px`,
                    width: '100%',
                    position: 'relative',
                  }}
                >
                  {virtualItems.map((virtualRow) => {
                    const position = filteredPositions[virtualRow.index];
                    const totalFees = position.overnightFee + position.locateCost + 
                      position.commissions + position.miscFees + position.interestIncome + 
                      position.marketDataFee - position.rebates;

                    return (
                      <div
                        key={virtualRow.key}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: `${virtualRow.size}px`,
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                      >
                        <table className="w-full text-sm">
                          <tbody>
                            <tr className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
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
                          </tbody>
                        </table>
                      </div>
                    );
                  })}
                </div>
              </div>
            </td>
          </tr>
        </tbody>
        <tfoot className="sticky bottom-0 bg-white dark:bg-gray-900 z-10">
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
              {formatCurrency(filteredTotalInterestFees)}
            </td>
            <td className="p-2 text-right text-indigo-600 dark:text-indigo-400">
              {formatCurrency(filteredTotalMarketDataFees)}
            </td>
            <td className="p-2 text-right text-red-600 dark:text-red-400">
              {formatCurrency(filteredTotalFees)}
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
  );
}
