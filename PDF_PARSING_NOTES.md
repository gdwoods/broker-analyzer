# PDF Parsing Implementation Notes

## ✅ Status: Implemented and Ready

PDF parsing is now fully functional! The app can extract text from PDF files and intelligently parse borrow fees and locate costs.

## 🔍 How It Works

The PDF parser:

1. **Extracts all text** from the PDF using Mozilla's PDF.js library
2. **Searches for patterns** indicating borrow fees and locate costs
3. **Identifies symbols** using uppercase letter patterns (1-5 letters)
4. **Extracts dates** in various formats
5. **Finds dollar amounts** associated with fees
6. **Groups by symbol and date** for accurate analysis

## 🎯 Recognized Keywords

The parser looks for these terms (case-insensitive):

**Borrow Fees:**
- "borrow"
- "htb" (Hard To Borrow)
- "hard to borrow"
- "short fee"

**Locate Costs:**
- "locate"
- "location fee"

## 📝 First-Time Testing

When you first upload a Cobra PDF:

1. **Upload your statement** - The app will attempt to parse it
2. **Check the results** - Verify fees and symbols are correct
3. **If data looks incorrect** - Please save a sample PDF and contact me

The parser uses heuristic pattern matching, so it should work with most standard brokerage statement formats. However, if Cobra uses a unique format, we may need to fine-tune the parsing logic.

## 🛠️ Customization (If Needed)

If the parser doesn't work perfectly with your Cobra statements, you can customize it:

### 1. Add More Keywords

In `lib/statementParser.ts`, find the `patterns` object in `parsePDFText()`:

```typescript
const patterns = {
  borrowFeeKeywords: /borrow|htb|hard.to.borrow|short.fee/i,
  locateKeywords: /locate|location.fee/i,
};
```

Add any additional terms Cobra uses in their PDFs.

### 2. Adjust Symbol Matching

If symbols aren't being caught:

```typescript
// Current pattern (1-5 uppercase letters)
symbol: /\b[A-Z]{1,5}\b/,

// For longer symbols or different formats:
symbol: /\b[A-Z]{1,10}\b/,  // Up to 10 letters
```

### 3. Date Format Adjustment

Current date patterns:
```typescript
date: /\b(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{4}[-/]\d{1,2}[-/]\d{1,2})\b/,
```

This handles:
- MM/DD/YYYY
- MM-DD-YYYY
- YYYY-MM-DD
- MM/DD/YY

### 4. Debug Mode

To see what text is being extracted from your PDF, you can temporarily add this in `parsePDF()`:

```typescript
// After fullText is built
console.log('Extracted PDF text:', fullText);
```

Then check the browser console after uploading.

## 📊 Expected PDF Structure

The parser works best when the PDF has:
- Clear section headers for fees
- Consistent formatting
- Symbol names near fee amounts
- Dates associated with transactions

## 🔧 Alternative: Manual Extraction

If PDFs prove problematic, you can:

1. **Copy/paste from PDF** into a spreadsheet
2. **Export to CSV** from spreadsheet
3. **Upload CSV** to the analyzer

The CSV parser is very robust and may be more reliable for complex statement formats.

## 💡 Tips for Best Results

1. **Upload the original PDF** from Cobra (not screenshots or scans)
2. **Check for digital text** - Make sure the PDF contains selectable text, not just images
3. **Try a recent statement** first - Newer statements may have better formatting
4. **Report issues** - If something looks wrong, let me know so I can improve the parser

## 🚀 Moving Forward

The parser is designed to be flexible and handle various formats. If you encounter any issues with your specific Cobra PDFs:

1. Upload a statement and note what's wrong
2. Share a sample (redacted if needed) so I can see the format
3. I'll update the parser to handle Cobra's specific layout

The goal is to make this **"just work"** with your actual statements, so don't hesitate to report any parsing issues!

---

**Current Status**: ✅ PDF parsing functional and ready for testing with real Cobra statements

