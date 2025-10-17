# Sample Data Format

## CSV Format Example

Here's an example of how your Cobra Trading statement CSV should be structured:

```csv
Symbol,Date,Quantity,Borrow Fee,Locate Cost,Borrow Rate,Market Value
AAPL,2024-10-01,1000,45.50,10.00,12.5,175000
TSLA,2024-10-01,500,125.00,25.00,45.0,130000
GME,2024-10-02,2000,350.00,50.00,85.0,42000
AAPL,2024-10-02,1000,45.50,10.00,12.5,175500
TSLA,2024-10-02,500,125.00,25.00,45.0,131000
```

## Excel Format

The Excel format should have the same columns as the CSV, typically in the first sheet.

## Column Name Variations Supported

The parser is flexible and recognizes these column names:

### Symbol
- Symbol
- Ticker  
- Stock
- Security

### Date
- Date
- Trade Date
- Settlement Date
- Transaction Date

### Quantity
- Quantity
- Qty
- Shares
- Position

### Borrow Fee
- Borrow Fee
- BorrowFee
- Hard to Borrow Fee
- HTB Fee

### Locate Cost
- Locate
- Locate Cost
- Locate Fee
- LocateCost

### Borrow Rate
- Borrow Rate
- Rate
- HTB Rate
- Annual Rate

### Market Value
- Value
- Market Value
- Position Value

## Creating Test Data

If you want to test the app without real Cobra statements:

1. Create a CSV file with the columns above
2. Add sample data with your symbols and estimated fees
3. Upload to see how the analysis looks

## Tips for Best Results

1. **Ensure all monetary values are numeric** (without $ symbols)
2. **Use consistent date format** (YYYY-MM-DD recommended)
3. **Include all required columns** (Symbol, Date, at least one fee type)
4. **Remove any summary rows** from the bottom of statements
5. **Keep header row** as the first row

## Common Issues

### "No borrow fee data found"
- Check that your CSV has either "Borrow Fee" or "Locate Cost" columns
- Verify that fee values are numeric (not blank or text)
- Ensure at least one row has a fee value > 0

### Incorrect totals
- Check for duplicate rows in your statement
- Verify all fee amounts are positive numbers
- Ensure date format is parseable

### Wrong symbol names
- Make sure Symbol/Ticker column contains valid stock symbols
- Remove any special characters or spaces


