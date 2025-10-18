# 🐍 Cobra Fee Analyzer

A powerful web application for analyzing Cobra Trading monthly statements, focusing on borrow fees, locate costs, and trading patterns.

## Features

### Phase 1 (Current)
- 📊 **Fee Analysis**: Comprehensive breakdown of borrow fees and locate costs
- 📈 **Visual Dashboard**: Interactive charts and graphs
- 🔝 **Top Positions**: Identify your most expensive positions
- 📅 **Daily Breakdown**: Track fees by day
- 📉 **Historical Comparison**: Compare multiple months side-by-side
- 💾 **Client-Side Processing**: All data stays in your browser (no server uploads)

### Phase 2 (Planned)
- 🎯 Trading pattern analysis
- 💡 AI-powered suggestions
- 📊 Win/loss ratio analysis
- ⏱️ Optimal entry/exit timing insights

## Getting Started

### Prerequisites
- Node.js 18+ installed
- Your Cobra Trading monthly statements in CSV or Excel format

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/cobra-analyzer.git
cd cobra-analyzer
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Upload Statement**: Drag & drop your Cobra monthly statement (CSV or Excel format)
2. **View Analysis**: See instant breakdown of fees, costs, and patterns
3. **Compare Months**: Upload multiple statements to see trends over time
4. **Export Reports**: Generate PDF reports of your analysis (coming soon)

### 💡 Important: Complete Trading History

For accurate P&L calculations, **upload enough trading history to include all positions that affect the current period**. If you have positions that started before your statement period, include those trades in your upload.

**Example**: If you're analyzing October 2024 but have positions that started in September, include both months' data for complete P&L accuracy.

## Supported File Formats

- ✅ **CSV (.csv)** - Recommended for accuracy
- ✅ **Excel (.xlsx, .xls)** - Also recommended
- 🔄 **PDF (.pdf)** - Convert to CSV first (see [HOW_TO_CONVERT_PDF.md](./HOW_TO_CONVERT_PDF.md))

**Why CSV/Excel?** These formats provide 100% accuracy and faster processing. Most brokers allow you to export statements as CSV directly.

## Statement Format

The analyzer expects Cobra Trading statements with the following columns (names may vary):
- **Symbol/Ticker**: Stock symbol
- **Date**: Transaction date
- **Quantity**: Number of shares
- **Borrow Fee**: Hard-to-borrow fees
- **Locate Cost/Fee**: Locate fees
- **Borrow Rate**: Annual borrow rate (optional)
- **Value/Market Value**: Position value (optional)

## Deployment

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/cobra-analyzer)

1. Push your code to GitHub
2. Import the project in Vercel
3. Deploy with one click!

### Environment Variables

No environment variables required - the app runs entirely client-side for data privacy.

## Privacy & Security

- ✅ All statement parsing happens in your browser
- ✅ No data is sent to any server
- ✅ No cookies or tracking
- ✅ Your financial data stays private

## Technology Stack

- **Framework**: Next.js 15
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **UI Components**: Radix UI
- **File Parsing**: 
  - CSV: PapaParse
  - Excel: XLSX
  - PDF: pdf-parse (coming soon)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this for your trading group!

## Roadmap

- [x] Phase 1: Basic fee analysis
- [x] CSV/Excel file upload
- [x] Fee breakdown charts
- [x] Historical comparison
- [ ] PDF statement support
- [ ] Phase 2: Trading pattern analysis
- [ ] AI-powered suggestions
- [ ] PDF export of analysis
- [ ] Multi-broker support

## Support

For questions or issues, please open an issue on GitHub or contact the development team.

---

Built with ❤️ for traders who want to understand their costs


