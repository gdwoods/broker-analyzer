# Quick Start Guide

## 🚀 Get Up and Running in 5 Minutes

### Step 1: Install Dependencies
```bash
cd /Users/garthwoods/cobra-analyzer
npm install
```

### Step 2: Start Development Server
```bash
npm run dev
```

### Step 3: Open in Browser
Open [http://localhost:3000](http://localhost:3000)

### Step 4: Test with Sample Data
1. Download the sample CSV: `/public/sample-statement.csv`
2. Drag and drop it into the upload area
3. See the analysis come to life! 🎉

## 📊 What You'll See

After uploading a statement, you'll see:

1. **Summary Cards**
   - Total fees paid
   - Breakdown of borrow vs locate costs
   - Average daily cost
   - Most expensive position

2. **Visual Charts**
   - Fee breakdown pie chart
   - Top 10 most expensive symbols
   - Daily fee trends

3. **Historical Comparison** (after uploading 2+ statements)
   - Month-over-month trends
   - Fee comparison charts
   - Summary table

## 🎯 Using Your Own Data

### Format Your Cobra Statement

### Supported Formats
- ✅ **CSV (.csv)** - Recommended
- ✅ **Excel (.xlsx, .xls)** - Also recommended  
- 🔄 **PDF** - Please convert to CSV first ([conversion guide](./HOW_TO_CONVERT_PDF.md))

**Have a PDF?** Check your broker's website for a CSV export option, or see our [PDF conversion guide](./HOW_TO_CONVERT_PDF.md).

Your statement should include:
- Symbol (required)
- Date (required)
- Borrow Fee (at least one fee type required)
- Locate Cost (at least one fee type required)
- Quantity (optional)
- Borrow Rate (optional)
- Market Value (optional)

### Upload Steps
1. Click the upload area or drag & drop your file
2. Wait a few seconds for processing
3. Review your analysis
4. Upload additional months to compare trends

## 🔧 Troubleshooting

### "No borrow fee data found"
- Check your CSV has "Borrow Fee" or "Locate Cost" columns
- Ensure values are numbers (remove $ signs)
- At least one row must have a fee > 0

### Nothing happens after upload
- Check browser console (F12) for errors
- Verify file is CSV or Excel format
- Make sure file isn't corrupted

### Charts not showing
- Refresh the page
- Try a different browser
- Check that your data has multiple rows

## 📱 Browser Support

Works best on:
- Chrome/Edge (recommended)
- Firefox
- Safari

## 🎨 Dark Mode

Click the "🌓 Toggle Dark Mode" button in the top right

## 💾 Data Privacy

- All processing happens in your browser
- No data is sent to any server
- Your statements stay 100% private
- Clear data anytime with "Clear All Data" button

## 📈 Next Steps

1. Upload your real Cobra statements
2. Compare multiple months
3. Identify your most expensive positions
4. Track how fees change over time
5. Share insights with your trading group

## 🚢 Ready to Deploy?

See [DEPLOYMENT.md](./DEPLOYMENT.md) for instructions on deploying to Vercel, Netlify, or your own server.

## Need Help?

- Check [README.md](./README.md) for full documentation
- Review [SAMPLE_DATA.md](./SAMPLE_DATA.md) for data format details
- Open an issue on GitHub for support

---

Happy analyzing! 📊


