'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, RotateCcw } from 'lucide-react';
import type { BorrowPosition } from '@/app/page';

interface DateRangeSliderProps {
  positions: BorrowPosition[];
  onDateRangeChange: (filteredPositions: BorrowPosition[]) => void;
}

export default function DateRangeSlider({ positions, onDateRangeChange }: DateRangeSliderProps) {
  const [dateRange, setDateRange] = useState<[string, string]>(['', '']);
  const [isInitialized, setIsInitialized] = useState(false);

  // Extract unique dates from positions
  const allDates = Array.from(new Set(positions.map(p => p.date)))
    .sort()
    .map(date => new Date(date));

  const minDate = allDates[0];
  const maxDate = allDates[allDates.length - 1];

  // Initialize date range with full range
  useEffect(() => {
    if (allDates.length > 0 && !isInitialized) {
      const startDate = minDate.toISOString().split('T')[0];
      const endDate = maxDate.toISOString().split('T')[0];
      setDateRange([startDate, endDate]);
      setIsInitialized(true);
    }
  }, [allDates, minDate, maxDate, isInitialized]);

  // Filter positions based on date range
  useEffect(() => {
    if (dateRange[0] && dateRange[1]) {
      const filtered = positions.filter(pos => {
        const posDate = new Date(pos.date);
        const startDate = new Date(dateRange[0]);
        const endDate = new Date(dateRange[1]);
        return posDate >= startDate && posDate <= endDate;
      });
      onDateRangeChange(filtered);
    }
  }, [dateRange, positions, onDateRangeChange]);

  const handleStartDateChange = (value: string) => {
    setDateRange([value, dateRange[1]]);
  };

  const handleEndDateChange = (value: string) => {
    setDateRange([dateRange[0], value]);
  };

  const resetToFullRange = () => {
    if (minDate && maxDate) {
      const startDate = minDate.toISOString().split('T')[0];
      const endDate = maxDate.toISOString().split('T')[0];
      setDateRange([startDate, endDate]);
    }
  };

  const formatDateForDisplay = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (allDates.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Date Range Filter
        </CardTitle>
        <CardDescription>
          Filter data by date range. Current range: {dateRange[0] && dateRange[1] && (
            <>
              {formatDateForDisplay(dateRange[0])} - {formatDateForDisplay(dateRange[1])}
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="start-date" className="text-sm font-medium">
              Start Date
            </label>
            <input
              id="start-date"
              type="date"
              value={dateRange[0]}
              onChange={(e) => handleStartDateChange(e.target.value)}
              min={minDate?.toISOString().split('T')[0]}
              max={maxDate?.toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="end-date" className="text-sm font-medium">
              End Date
            </label>
            <input
              id="end-date"
              type="date"
              value={dateRange[1]}
              onChange={(e) => handleEndDateChange(e.target.value)}
              min={minDate?.toISOString().split('T')[0]}
              max={maxDate?.toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            Showing {positions.filter(pos => {
              if (!dateRange[0] || !dateRange[1]) return true;
              const posDate = new Date(pos.date);
              const startDate = new Date(dateRange[0]);
              const endDate = new Date(dateRange[1]);
              return posDate >= startDate && posDate <= endDate;
            }).length} of {positions.length} transactions
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={resetToFullRange}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset to Full Range
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
