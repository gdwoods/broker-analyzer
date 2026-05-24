# 🐍 Cobra Fee Analyzer - User Documentation

## Overview

The Cobra Fee Analyzer is a powerful web application that helps you analyze trading fees, locate costs, and profit & loss patterns from your Cobra Trading statements. All data processing happens locally in your browser - your data never leaves your device.

## 🔒 Data Privacy & Security

- **100% Local Processing**: All data analysis happens in your browser
- **No Data Transmission**: Your trading statements never leave your device
- **No Account Required**: No registration or login needed
- **Secure**: No data is stored on external servers

## 📋 Supported File Formats

- **CSV Files**: Comma-separated values (.csv)
- **Excel Files**: Microsoft Excel (.xls, .xlsx)
- **File Size Limit**: Up to 10MB per file

## 🚀 Getting Started

### 1. Upload Your Statement

1. **Navigate to the app**: Open the Cobra Fee Analyzer in your web browser
2. **Click "Choose File"** or drag and drop your statement file
3. **Supported formats**: Upload your .xlsx export file from the Cobra Account Activity page
4. **Wait for processing**: The app will automatically parse and analyze your data

### 2. View Your Dashboard

Once uploaded, you'll see a comprehensive dashboard with:

- **Financial Summary Cards**: Key metrics and totals
- **Advanced Analytics**: Performance insights and risk analysis
- **Interactive Charts**: Visual breakdowns of fees and P&L
- **Transaction Details**: Complete transaction history with filtering

## 📊 Dashboard Sections

### Financial Summary Cards

The dashboard displays key financial metrics in organized sections:

#### Core Financial Metrics
- **Total Fees**: Sum of all trading fees for the period
- **Net P&L**: Profit/Loss after all fees
- **Gross P&L**: Profit/Loss before fees
- **Most Expensive Symbol**: Symbol with highest total fees

#### Daily Cost Analysis
- **Avg Overnight Daily Cost**: Average daily overnight fees
- **Avg Daily Locate Cost**: Average daily locate costs
- **Avg Total Daily Cost**: Average daily total fees

#### Fee Breakdown by Category
- **Overnight Fees**: Borrowing costs for overnight positions
- **Locate Costs**: Fees for locating shares to short
- **Commissions**: Trading commissions
- **Misc Fees**: Miscellaneous trading fees
- **Market Data Fees**: Market data subscription costs
- **Other Fees**: Additional fee categories
- **Interest Income**: Interest received (credited, not a fee)
- **Rebates**: ECN rebates (credited, reduces total fees)

### Advanced Analytics

#### Symbol Performance
- **Best Performer**: Symbol with best efficiency ratio (P&L vs fees)
- **Worst Performer**: Symbol with worst efficiency ratio

#### Fee Efficiency Metrics
- **Cost per $ Profit**: Ratio of fees to profit
- **Profit Margin**: Percentage of profit relative to total activity

#### Risk Analysis
Click on any of these cards to view detailed position breakdowns:
- **High-Cost Positions**: Positions with fees > $100
- **Loss Positions**: Positions with negative P&L
- **High-Fee Symbols**: Symbols with total fees > $50

### Interactive Charts

#### Daily Fee Breakdown & P&L
- **Stacked Fee Bars**: Daily expense fees (Overnight, Locate, Commissions, Misc)
- **Gross P&L Line**: Separate line showing daily profit/loss trends
- **Color Coding**: Consistent colors across all charts

#### Interactive Fee Breakdown
- **Drill-down Pie Chart**: Click on fee categories to explore by symbol and date
- **Symbol Breakdown**: See which symbols contribute most to each fee type
- **Date Breakdown**: View fee patterns over time

### Transaction Details Table

Complete transaction history with filtering capabilities:

#### Available Filters
- **Date Filter**: Filter by specific dates
- **Symbol Filter**: Filter by ticker symbols
- **Type Filter**: Filter by transaction type (All, Overnight, Locate, Market Data, Interest, Trading)

#### Table Columns
1. **Date**: Transaction date
2. **Symbol**: Stock ticker symbol
3. **Type**: Transaction type
4. **Quantity**: Number of shares
5. **Price**: Price per share
6. **Locate**: Locate costs
7. **Misc**: Miscellaneous fees
8. **Overnight**: Overnight fees
9. **Commission**: Trading commissions
10. **Rebate**: ECN rebates
11. **Interest**: Interest income (credited)
12. **Market Data**: Market data fees
13. **Total Fees**: Sum of all fees (excluding credits)
14. **P&L**: Profit/Loss for the position

#### Export Options
- **CSV Export**: Download transaction data as CSV file
- **Excel Export**: Download transaction data as Excel file

## 🎯 How to Use Key Features

### Analyzing Fee Patterns

1. **View the Daily Fee Breakdown chart** to see fee trends over time
2. **Use the Interactive Fee Breakdown** to drill down into specific fee categories
3. **Check the Fee Efficiency Metrics** to understand cost-to-profit ratios

### Identifying Risk Areas

1. **Click on Risk Analysis cards** to see detailed position breakdowns:
   - Click "High-Cost Positions" to see which trades had fees > $100
   - Click "Loss Positions" to see losing trades
   - Click "High-Fee Symbols" to see symbols with high total fees

### Filtering Transaction Data

1. **Use the filter inputs** above the Transaction Details table:
   - Enter dates in the Date filter (e.g., "2024-01" or "2024-01-15")
   - Enter symbol names in the Symbol filter (e.g., "AAPL" or "TSLA")
   - Select transaction types from the Type dropdown
2. **Click "Clear All Filters"** to reset all filters

### Exporting Data

1. **Scroll to the Transaction Details table**
2. **Apply any desired filters** to export only specific data
3. **Click "Export to CSV"** or "Export to XLSX"** buttons
4. **Download the file** to your computer

## 💡 Tips for Best Results

### File Preparation
- **Use recent data**: Include enough trading history for accurate P&L calculations
- **Complete statements**: Ensure your export includes all relevant transactions
- **Clean data**: Verify your statement file is not corrupted

### Analysis Best Practices
- **Check the period**: Verify the date range matches your expectations
- **Review outliers**: Use Risk Analysis to identify unusual fee patterns
- **Compare symbols**: Use Symbol Performance to find your most/least efficient trades
- **Monitor trends**: Use Daily Fee Breakdown to spot patterns over time

### Troubleshooting

#### Common Issues
- **"No data found"**: Check that your file format is supported and contains trading data
- **Missing transactions**: Ensure your statement export includes all relevant date ranges
- **Incorrect totals**: Verify your statement file is complete and not truncated

#### File Format Requirements
- **Excel files**: Must have data in the first worksheet
- **CSV files**: Must have proper column headers
- **Data structure**: Must contain recognizable trading data columns

## 🔧 Technical Details

### Browser Requirements
- **Modern browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **JavaScript enabled**: Required for data processing
- **Local storage**: Used for caching parsed data (optional)

### Performance
- **File size limit**: 10MB maximum
- **Caching**: Previously parsed files are cached for faster reloading
- **Processing time**: Large files may take a few moments to process

## 📞 Support

### Getting Help
- **Check this documentation** for common questions
- **Verify file format** matches supported types
- **Ensure data completeness** in your statement export

### Data Privacy Reminder
Remember: All processing happens locally in your browser. Your trading data never leaves your device, ensuring complete privacy and security.

---

**Last Updated**: October 2024
**Version**: 1.0
**Developer**: Cobra Fee Analyzer Team
