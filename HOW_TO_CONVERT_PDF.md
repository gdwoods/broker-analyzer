# How to Convert Cobra PDF Statements to CSV

Since PDF parsing can be unreliable due to varying formats, the most accurate way to analyze your statements is to convert them to CSV or Excel first.

## 🎯 Recommended Methods

### Method 1: Export from Cobra (Best Option)

1. Log into your Cobra Trading account
2. Go to Statements or Reports
3. Look for "Export" or "Download" options
4. Select **CSV** or **Excel** format instead of PDF
5. Upload the exported file to the analyzer

**This is the most reliable method** as it gives you the raw data directly from Cobra.

### Method 2: Use Adobe Acrobat (If Available)

1. Open your PDF in Adobe Acrobat
2. Go to File → Export To → Spreadsheet → Excel or CSV
3. Save the file
4. Upload to the analyzer

### Method 3: Online PDF to CSV Converters

**Free online tools:**
- [Zamzar](https://www.zamzar.com/convert/pdf-to-csv/) - pdf-to-csv.zamzar.com
- [ConvertIO](https://convertio.co/pdf-csv/) - convertio.co/pdf-csv
- [PDF2Go](https://www.pdf2go.com/pdf-to-csv) - pdf2go.com/pdf-to-csv
- [iLovePDF](https://www.ilovepdf.com/pdf_to_excel) - Convert to Excel then save as CSV

**Steps:**
1. Go to one of the sites above
2. Upload your PDF
3. Download the CSV/Excel file
4. Clean up if needed (remove header/footer rows)
5. Upload to Cobra Fee Analyzer

⚠️ **Privacy Note**: If using online converters, ensure the statement doesn't contain sensitive personal info, or redact it first.

### Method 4: Copy & Paste into Spreadsheet

1. Open your PDF
2. Select and copy the transaction/fee data
3. Paste into Google Sheets or Excel
4. Clean up the formatting
5. Save as CSV
6. Upload to the analyzer

## 📝 Expected CSV Format

After conversion, your CSV should have these columns:

```csv
Symbol,Date,Quantity,Borrow Fee,Locate Cost,Borrow Rate,Market Value
AAPL,2024-10-01,1000,45.50,10.00,12.5,175000
TSLA,2024-10-01,500,125.00,25.00,45.0,130000
```

**Required columns:**
- Symbol (stock ticker)
- Date
- At least one of: Borrow Fee or Locate Cost

**Optional but helpful:**
- Quantity
- Borrow Rate
- Market Value

## 🔧 Cleaning Up Your CSV

If your converted CSV has extra rows:

1. Open in Excel or Google Sheets
2. **Remove header rows** (company name, account info, etc.)
3. **Remove footer rows** (totals, disclaimers, etc.)
4. **Keep only the transaction data**
5. **Ensure first row is column headers**
6. Save and upload

## 💡 Pro Tips

1. **Keep your PDFs** - Don't delete them after converting
2. **Check the data** - Make sure numbers match between PDF and CSV
3. **One month at a time** - Convert and upload each month separately
4. **Consistent format** - Use the same conversion method each time
5. **Save your CSVs** - Keep them for future reference

## ❓ Troubleshooting

**Problem: "No borrow fee data found"**
- Check that your CSV has "Borrow Fee" or "Locate" column
- Ensure fee amounts are numbers (not blank or text)
- Remove any summary/total rows

**Problem: Wrong symbols or dates**
- Check column headers match expected names
- Ensure dates are in MM/DD/YYYY or YYYY-MM-DD format
- Verify symbols are uppercase (AAPL not Apple)

**Problem: Fees don't match PDF**
- Some converters scramble data - try a different method
- Manual copy/paste might be more accurate
- Check if any fees are in a different column

## 🚀 Future: Direct PDF Support

I'm working on implementing reliable PDF parsing that works with Next.js. For now, CSV/Excel conversion provides:
- ✅ 100% accuracy
- ✅ Fast processing  
- ✅ No compatibility issues
- ✅ Easy to verify data

---

**Need help?** If you're having trouble converting your statements, let me know what broker/format you have and I can provide specific guidance!

