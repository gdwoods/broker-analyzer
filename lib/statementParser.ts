import type { StatementData, BorrowPosition, FeeSummary } from "@/app/page";
import Papa from "papaparse";
import * as XLSX from "xlsx";

export async function parseStatement(file: File): Promise<StatementData> {
  const fileType = file.name.split('.').pop()?.toLowerCase();

  switch (fileType) {
    case 'csv':
      return parseCSV(file);
    case 'xlsx':
    case 'xls':
      return parseExcel(file);
    case 'pdf':
      return parsePDF(file);
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}

async function parseCSV(file: File): Promise<StatementData> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        try {
          const data = processData(results.data as Record<string, unknown>[], file.name);
          resolve(data);
        } catch (err) {
          reject(err);
        }
      },
      error: (error) => {
        reject(new Error(`CSV parse error: ${error.message}`));
      },
    });
  });
}

async function parseExcel(file: File): Promise<StatementData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[];
        
        const statementData = processData(jsonData, file.name);
        resolve(statementData);
      } catch (err) {
        reject(new Error(`Excel parse error: ${err instanceof Error ? err.message : 'Unknown error'}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read Excel file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}

async function parsePDF(file: File): Promise<StatementData> {
  // Use legacy build which is browser-compatible
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  
  // Set worker source to legacy version
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.69/pdf.worker.min.mjs`;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const typedArray = new Uint8Array(arrayBuffer);
        
        // Load PDF document
        const pdf = await pdfjs.getDocument({ data: typedArray }).promise;
        
        let fullText = '';
        
        // Extract text from all pages
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item) => {
              if ('str' in item) {
                return item.str;
              }
              return '';
            })
            .join(' ');
          fullText += pageText + '\n';
        }
        
        // Parse the extracted text
        const positions = parsePDFText(fullText);
        
        if (positions.length === 0) {
          throw new Error('No borrow fee data found in PDF. Please check the file format or contact support.');
        }
        
        // Calculate summary
        const summary = calculateSummary(positions);
        const period = extractPeriod(file.name);
        
  const statementData: StatementData = {
    fileName: file.name,
    uploadDate: new Date(),
    period,
    totalOvernightFees: positions.reduce((sum, p) => sum + p.overnightFee, 0),
    totalLocateCosts: positions.reduce((sum, p) => sum + p.locateCost, 0),
    totalMarketDataFees: positions.reduce((sum, p) => sum + p.marketDataFee, 0),
    totalInterestFees: positions.reduce((sum, p) => sum + p.interestFee, 0),
    totalOtherFees: positions.reduce((sum, p) => sum + p.otherFees, 0),
    totalCommissions: positions.reduce((sum, p) => sum + p.commissions, 0),
    totalRebates: positions.reduce((sum, p) => sum + p.rebates, 0),
    totalMiscFees: positions.reduce((sum, p) => sum + p.miscFees, 0),
    positions,
    summary,
  };
        
        resolve(statementData);
      } catch (err) {
        reject(new Error(`PDF parse error: ${err instanceof Error ? err.message : 'Unknown error'}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read PDF file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}

function parsePDFText(text: string): BorrowPosition[] {
  const positions: BorrowPosition[] = [];
  const lines = text.split('\n');
  
  // Common patterns in brokerage statements
  const patterns = {
    // Look for stock symbols (1-5 uppercase letters)
    symbol: /\b[A-Z]{1,5}\b/,
    // Look for dates (various formats)
    date: /\b(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{4}[-/]\d{1,2}[-/]\d{1,2})\b/,
    // Look for dollar amounts
    amount: /\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/,
    // Look for keywords indicating fees
    borrowFeeKeywords: /borrow|htb|hard.to.borrow|short.fee/i,
    locateKeywords: /locate|location.fee/i,
  };
  
  let currentDate = new Date().toISOString().split('T')[0];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Try to extract date from line
    const dateMatch = line.match(patterns.date);
    if (dateMatch) {
      try {
        const parsedDate = new Date(dateMatch[1]);
        if (!isNaN(parsedDate.getTime())) {
          currentDate = parsedDate.toISOString().split('T')[0];
        }
      } catch {
        // Keep using previous date
      }
    }
    
    // Look for lines that mention borrow or locate fees
    const isBorrowLine = patterns.borrowFeeKeywords.test(line);
    const isLocateLine = patterns.locateKeywords.test(line);
    
    if (isBorrowLine || isLocateLine) {
      // Extract symbol (look in current and nearby lines)
      let symbol = '';
      const symbolMatch = line.match(patterns.symbol);
      if (symbolMatch) {
        symbol = symbolMatch[0];
      } else {
        // Check previous few lines for symbol
        for (let j = Math.max(0, i - 3); j < i; j++) {
          const prevMatch = lines[j].match(patterns.symbol);
          if (prevMatch) {
            symbol = prevMatch[0];
            break;
          }
        }
      }
      
      // Extract amounts
      const amounts = line.match(new RegExp(patterns.amount.source, 'g'));
      if (amounts && symbol) {
        const cleanAmount = parseFloat(amounts[0].replace(/[$,]/g, ''));
        
        if (!isNaN(cleanAmount) && cleanAmount > 0) {
          // Check if this symbol/date combination already exists
          const existingIndex = positions.findIndex(
            p => p.symbol === symbol && p.date === currentDate
          );
          
          if (existingIndex >= 0) {
            // Update existing position
            if (isBorrowLine) {
              positions[existingIndex].overnightFee += cleanAmount;
            }
            if (isLocateLine) {
              positions[existingIndex].locateCost += cleanAmount;
            }
          } else {
            // Create new position
            positions.push({
              symbol,
              date: currentDate,
              quantity: 0,
              overnightFee: isBorrowLine ? cleanAmount : 0,
              locateCost: isLocateLine ? cleanAmount : 0,
              marketDataFee: 0,
              interestFee: 0,
              otherFees: 0,
              commissions: 0,
              rebates: 0,
              miscFees: 0,
              borrowRate: 0,
              value: 0,
              transactionType: isBorrowLine ? 'overnight' : isLocateLine ? 'locate' : 'trading',
            });
          }
        }
      }
    }
  }
  
  return positions;
}

function processData(rawData: Record<string, unknown>[], fileName: string): StatementData {
  const positions: BorrowPosition[] = [];
  const tradingData = new Map<string, { pnl: number; quantity: number; value: number }>();

  // Debug: Comprehensive analysis of the statement
  if (rawData.length > 0) {
    console.log('📊 Available columns in your file:', Object.keys(rawData[0]));
    console.log('📝 First 10 rows sample:', rawData.slice(0, 10));
    
    // Comprehensive column analysis
    const sampleRow = rawData[0];
    console.log('🔍 DETAILED COLUMN ANALYSIS:');
    console.log('Column | Value | Parsed | Type | Notes');
    console.log('-------|-------|--------|------|------');
    
    for (const [key, value] of Object.entries(sampleRow)) {
      const strValue = String(value);
      const numValue = parseFloat(strValue.replace(/[^0-9.-]/g, ''));
      const isNumeric = !isNaN(numValue);
      const isSymbol = /^[A-Z]{1,5}[0-9]?$/.test(strValue.trim());
      
      let notes = '';
      if (key.toLowerCase().includes('pnl') || key.toLowerCase().includes('profit') || 
          key.toLowerCase().includes('loss') || key.toLowerCase().includes('gain')) {
        notes += '⭐P&L ';
      }
      if (isSymbol) {
        notes += '🎯SYMBOL ';
      }
      if (isNumeric && numValue !== 0) {
        notes += '💰NUMERIC ';
      }
      
      console.log(`${key.padEnd(7)} | ${strValue.substring(0, 15).padEnd(15)} | ${isNumeric ? numValue.toString().padEnd(6) : 'N/A'.padEnd(6)} | ${typeof value} | ${notes}`);
    }
    
    // Show specific columns as per user feedback
    const columnNames = Object.keys(sampleRow);
    console.log(`\n📋 COLUMN STRUCTURE:`);
    console.log(`   Column A (index 0): "${columnNames[0] || 'N/A'}" = "${sampleRow[columnNames[0]] || 'N/A'}"`);
    console.log(`   Column B (index 1): "${columnNames[1] || 'N/A'}" = "${sampleRow[columnNames[1]] || 'N/A'}"`);
    console.log(`   Column C (index 2): "${columnNames[2] || 'N/A'}" = "${sampleRow[columnNames[2]] || 'N/A'}"`);
    console.log(`   Column D (index 3): "${columnNames[3] || 'N/A'}" = "${sampleRow[columnNames[3]] || 'N/A'}"`);
    console.log(`   Column E (index 4): "${columnNames[4] || 'N/A'}" = "${sampleRow[columnNames[4]] || 'N/A'}"`);
    console.log(`   Column F (index 5): "${columnNames[5] || 'N/A'}" = "${sampleRow[columnNames[5]] || 'N/A'}"`);
    console.log(`   Column G (index 6): "${columnNames[6] || 'N/A'}" = "${sampleRow[columnNames[6]] || 'N/A'}"`);
    console.log(`   Column H (index 7): "${columnNames[7] || 'N/A'}" = "${sampleRow[columnNames[7]] || 'N/A'}"`);
    
    // Look for any rows with actual numeric values that could be P&L
    console.log('\n💰 SEARCHING FOR POTENTIAL P&L VALUES:');
    let foundPotentialPnL = false;
    
    for (let i = 0; i < Math.min(20, rawData.length); i++) {
      const row = rawData[i];
      for (const [key, value] of Object.entries(row)) {
        if (value !== null && value !== undefined && value !== '') {
          const strValue = String(value).replace(/[^0-9.-]/g, '');
          const num = parseFloat(strValue);
          // Look for reasonable P&L values (not fees, not too large)
          if (!isNaN(num) && num !== 0 && Math.abs(num) > 10 && Math.abs(num) < 50000) {
            // Skip obvious fee amounts
            if (num > 0 && num < 1000) continue;
            
            console.log(`Row ${i}: Column "${key}" = ${num} (original: "${value}")`);
            foundPotentialPnL = true;
          }
        }
      }
    }
    
    if (!foundPotentialPnL) {
      console.log('❌ No potential P&L values found in first 20 rows');
    }
  }

  // First pass: Collect trading data (P&L, quantities, values) from all rows
  let pnlRowsFound = 0;
  let symbolRowsFound = 0;
  let interestRowsChecked = 0;
  let interestRowsFound = 0;
  let rowIndex = 0;
  let rowsWithPercent = 0;
  let rowsWithDays = 0;
  let rowsWithBal = 0;
  
  // Debug: Check ALL rows for % in ANY column AND for "INTEREST" in description
  console.log('🔍 CHECKING FOR % CHARACTER AND "INTEREST" IN DESCRIPTION (all rows):');
  let percentFound = 0;
  let interestDescFound = 0;
  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];
    const columnNames = Object.keys(row);
    
    // Check for % in any column
    for (let j = 0; j < columnNames.length; j++) {
      const colName = columnNames[j];
      const value = String(row[colName] || '');
      if (value.includes('%')) {
        percentFound++;
        console.log(`   Row ${i}, Column ${j} (${colName}): "${value}"`);
      }
    }
    
    // Check for "INTEREST" in description
    const description = extractDescription(row);
    if (description && description.toUpperCase().includes('INTEREST')) {
      interestDescFound++;
      console.log(`   Row ${i} has INTEREST in description: "${description}" | Type: ${row[columnNames[14]] || 'N/A'} | Amount: ${row[columnNames[13]] || 'N/A'}`);
    }
  }
  console.log(`   Found % in ${percentFound} rows, Found INTEREST in ${interestDescFound} rows`);
  
  console.log(`📊 Starting first-pass loop. rawData.length = ${rawData.length}`);
  
  // First, let's search for any rows containing "STOCK BORROW FEE" or "BORROW" in the description
  console.log('🔍 DEBUG: About to start comprehensive borrow fee search');
  console.log(`🔍 SEARCHING FOR ALL BORROW FEE TRANSACTIONS...`);
  let borrowFeeCount = 0;
  
  try {
    for (let i = 0; i < rawData.length; i++) {
      try {
        const row = rawData[i];
        const description = extractDescription(row);
        if (description && (description.includes('BORROW') || description.includes('STOCK BORROW FEE'))) {
          borrowFeeCount++;
          console.log(`🔍 FOUND BORROW FEE ROW ${borrowFeeCount}: "${description}" | Amount: ${row['Amount']} | Type: ${row['Type']}`);
        }
      } catch (rowError) {
        console.error(`❌ ERROR processing row ${i}:`, rowError);
        console.error('Row data:', rawData[i]);
        console.error('Error details:', rowError instanceof Error ? rowError.message : String(rowError));
        // Continue processing other rows
      }
    }
    console.log(`📊 Total borrow fee transactions found: ${borrowFeeCount}`);
  } catch (error) {
    console.error('❌ ERROR in comprehensive borrow fee search:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace available');
  }
  
  console.log('🔍 DEBUG: Comprehensive search completed successfully');
  console.log('🔍 DEBUG: About to start first pass loop...');
  console.log('🔍 DEBUG: Setting up first pass variables...');
  console.log('🔍 DEBUG: First pass variables initialized');
  console.log('🔍 STARTING FIRST PASS PROCESSING...');
  
  try {
    console.log('🔍 DEBUG: Starting first pass loop iteration...');
    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      rowIndex = i; // Set rowIndex to match array position
      
      // Debug: Log first few iterations
      if (i < 5) {
        console.log(`🔍 FIRST PASS ROW ${i}: Processing row...`);
      }
      
      // DEBUG: Log progress every 100 rows and target rows
      if (i < 3 || i % 100 === 0 || i === 325 || i === 326 || i === 1064) {
        console.log(`🔍🔍🔍 ROW ${i} - Description: "${row['Description'] || 'EMPTY'}"`);
      }
    
    // Check for interest BEFORE skipping empty rows
    const description = String(row['Description'] || '');
    
    // Debug: Check what we're finding
    if (description.includes('%')) {
      rowsWithPercent++;
      console.log(`🔍 Row ${rowIndex}: Has % in description: "${description}"`);
    }
    if (description.toUpperCase().includes('DAYS')) {
      rowsWithDays++;
    }
    if (description.toUpperCase().includes('BAL')) {
      rowsWithBal++;
    }
    
    const isInterestTransaction = description && description.includes('%') && description.includes('DAYS') && description.includes('BAL');
    
    if (isInterestTransaction) {
      console.log(`✅ INTEREST FOUND at Row ${rowIndex}: "${description}"`);
    }
    
    if (!row || Object.keys(row).length === 0) {
      continue; // Don't increment here, increment at the end of loop
    }

    // Get column names and check for interest FIRST
    const columnNames = Object.keys(row);
    
    interestRowsChecked++;

    // Debug: Log what we find in Description column
    if (isInterestTransaction) {
      interestRowsFound++;
      const typeValue = columnNames.length > 14 ? row[columnNames[14]] : 'N/A';
      console.log(`🔍 FIRST PASS (actual row ${rowIndex}, checked ${interestRowsChecked}): Found interest in Description: "${description}" | Type: ${typeValue}`);
    }

    // Skip all rows where Type (Column O, index 14) = "Cash", EXCEPT interest transactions
    if (columnNames.length > 14 && !isInterestTransaction) {
      const typeColumn = columnNames[14]; // Column O - Type
      const typeValue = String(row[typeColumn] || '').trim();
      if (typeValue === 'Cash') {
        continue; // Don't increment here, increment at the end of loop
      }
    }

    // Use the description we already extracted above
    const symbol = extractSymbol(row) || extractSymbolFromDescription(description);
    
    // Count symbols found for debugging
    if (symbol) {
      symbolRowsFound++;
    }
    
    // Look for P&L data in various formats - don't require symbol for P&L
    const pnl = extractPnL(row);
    const quantity = extractQuantity(row);
    const value = extractValue(row);

    if (pnl !== 0 || quantity !== 0 || value !== 0) {
      // Use symbol if available, otherwise use description or row index
      const symbolKey = symbol || description || `row-${rawData.indexOf(row)}`;
      const dateKey = extractDate(row) || extractDateFromDescription(description) || 'unknown';
      const key = `${symbolKey}-${dateKey}`;
      
      const existing = tradingData.get(key) || { pnl: 0, quantity: 0, value: 0 };
      tradingData.set(key, {
        pnl: existing.pnl + pnl,
        quantity: existing.quantity + quantity,
        value: existing.value + value,
      });
      
      if (pnl !== 0) {
        pnlRowsFound++;
        console.log(`📈 Added P&L data: ${symbolKey} = $${pnl} on ${dateKey}`);
      }
    }
    } // Close the for loop
  } catch (error) {
    console.error(`❌ ERROR in first-pass loop at row ${rowIndex}:`, error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace available');
  }
  
  console.log(`📊 First-pass loop complete. Processed ${rowIndex} rows out of ${rawData.length} total rows`);
  console.log('🔍 DEBUG: First pass completed successfully');
  console.log(`📊 Rows with % in description: ${rowsWithPercent}, with DAYS: ${rowsWithDays}, with BAL: ${rowsWithBal}`);
  console.log(`📊 Total rows with symbols found: ${symbolRowsFound}`);
  console.log(`📊 Interest rows checked: ${interestRowsChecked}, Interest found: ${interestRowsFound}`);
  
  console.log(`📊 Total trading data entries found: ${tradingData.size}`);
  console.log(`💰 Total rows with P&L data: ${pnlRowsFound}`);
  
  // Show sample of trading data found
  console.log('🔍 Sample trading data entries:');
  let count = 0;
  for (const [key, data] of tradingData.entries()) {
    if (count < 5) {
      console.log(`  ${key}: P&L=${data.pnl}, Qty=${data.quantity}, Value=${data.value}`);
      count++;
    }
  }
  
  // If no P&L data found, log a warning
  if (pnlRowsFound === 0) {
    console.warn('⚠️ WARNING: No P&L data found in statement!');
    console.warn('   This could mean:');
    console.warn('   1. The statement does not contain P&L columns');
    console.warn('   2. P&L columns have different names than expected');
    console.warn('   3. All P&L values are zero');
    console.warn('   Please check the column analysis above to see available data.');
  }
  
  console.log('🔍 FIRST PASS COMPLETED - About to start second pass...');
  console.log('🔍 DEBUG: Reached second pass start point');
  console.log(`🔍 DEBUG: About to start second pass with ${rawData.length} rows`);
  
      // Second pass: Process borrow fees and match with trading data
      console.log('🔍 SECOND PASS: Looking for borrow fee transactions...');
      console.log(`🔍 SECOND PASS: Starting second pass loop with ${rawData.length} rows`);
      let borrowFeeRowsFound = 0;
      let cashRowsSkipped = 0;
      
      for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        const rowIndex = i;
        
        // Debug: Log first few rows in second pass
        if (i < 5) {
          console.log(`🔍 SECOND PASS ROW ${i}: Processing row with ${Object.keys(row).length} columns`);
        }
        
        // Skip empty rows
        if (!row || Object.keys(row).length === 0) continue;
        
    // Get column names and check for interest FIRST
    const columnNames = Object.keys(row);
    
    // Get the description column - this contains fee type and symbol
    const description = extractDescription(row);
    
    // Interest is in Description column (Column E) with format like "2.50000%16 DAYS,BAL=   $32583"
    const isInterestTransaction = description && description.includes('%') && description.includes('DAYS') && description.includes('BAL');

        // Debug: Log borrow fee transactions in second pass
        if (description && description.includes('STOCK BORROW FEE')) {
          console.log(`🔍 SECOND PASS BORROW FEE: "${description}" | Type: ${row['Type']} | Amount: ${row['Amount']}`);
          borrowFeeRowsFound++;
          
          // Debug: Show first 10 and every 50th borrow fee for tracking
          if (borrowFeeRowsFound <= 10 || borrowFeeRowsFound % 50 === 0) {
            console.log(`🔍 BORROW FEE #${borrowFeeRowsFound}: Processing "${description}" with amount ${row['Amount']}`);
          }
        }
    
    // Skip all rows where Type (Column O, index 14) = "Cash", EXCEPT interest transactions
    if (columnNames.length > 14 && !isInterestTransaction) {
      const typeColumn = columnNames[14]; // Column O - Type
      const typeValue = String(row[typeColumn] || '').trim();
      if (typeValue === 'Cash') {
        cashRowsSkipped++;
        continue;
      }
    }
        
        if (!description) continue;
        
        // Debug: Log every row with STOCK BORROW FEE in description
        if (description.includes('STOCK BORROW FEE')) {
          borrowFeeRowsFound++;
          console.log(`🔍 Found STOCK BORROW FEE row ${borrowFeeRowsFound}: "${description}" | Amount: ${row['Amount']} | Type: ${row['Type']}`);
        }
        
        // Process all trading transactions (not just borrow fees)
        // Skip non-trading rows like headers, totals, etc.
        if (!description || description.trim() === '' || description.includes('Total') || description.includes('Summary')) {
          continue;
        }
    
        // Categorize transaction type based on description and Column E
        let transactionType: 'overnight' | 'locate' | 'marketData' | 'interest' | 'trading';
        
        // Debug: Log all transaction descriptions to see what we're working with
        if (rowIndex < 50 || description.includes('STOCK BORROW FEE')) {
          console.log(`🔍 TRANSACTION ${rowIndex}: "${description}" | Amount: ${row['Amount']} | Type: ${row['Type']}`);
        }
        
        if (description.includes('MARK TO MARKET')) {
          // Ignore Mark To Market transactions
          continue;
        } else if (isInterestTransaction) {
          // Interest transactions have format like "2.50000%16 DAYS,BAL=   $32583" in description
          transactionType = 'interest';
          console.log(`✅ Detected interest transaction in Description: "${description}"`);
        } else if (description.includes('ACH') && row['Type'] === 'Cash') {
          // Ignore ACH transactions where Type = Cash (but only if NOT interest)
          continue;
        } else if (description.includes('STOCK BORROW FEE')) {
          // Determine fee type based on presence of "C"
          // "C STOCK BORROW FEE" = Locate fee (e.g., "10/13 C STOCK BORROW FEE GV")
          // "STOCK BORROW FEE" (no C) = Overnight borrow fee
          const isLocate = description.includes('C STOCK BORROW FEE');
          transactionType = isLocate ? 'locate' : 'overnight';
          console.log(`🔍 BORROW FEE DETECTED: "${description}" | Type: ${transactionType} | IsLocate: ${isLocate}`);
        } else if (description.includes('MARKET DATA')) {
          transactionType = 'marketData';
          console.log(`🔍 MARKET DATA TRANSACTION DETECTED: "${description}"`);
        } else if (description.includes('%') && description.includes('DAYS') && description.includes('BAL')) {
          // Interest transactions have pattern: "2.50000%16 DAYS,BAL=   $32583"
          transactionType = 'interest';
          console.log(`🔍 INTEREST TRANSACTION DETECTED: "${description}"`);
        } else {
          // This is a regular trading transaction
          transactionType = 'trading';
        }
    
        // Always prioritize Column D for symbol extraction
        let symbol = extractSymbol(row);
        
        // Only use description as fallback if Column D doesn't have a valid symbol
        if (!symbol || !/^[A-Z]{1,5}[0-9]?$/.test(symbol)) {
          symbol = extractSymbolFromDescription(description);
        }

        // For interest transactions, use a special symbol since they don't have stock symbols
        if (transactionType === 'interest' && (!symbol || !/^[A-Z]{1,5}[0-9]?$/.test(symbol))) {
          symbol = 'CASH'; // Interest is typically on cash balances
        }

    if (!symbol) {
      console.log('⚠️ Could not extract symbol from description or Column D:', description);
      console.log('   Transaction type:', transactionType);
      console.log('   Row data:', row);
      continue;
    }
    
    // Debug interest transactions specifically
    if (transactionType === 'interest') {
      console.log(`🔍 INTEREST PROCESSING: Symbol="${symbol}", Description="${description}", Amount="${row['Amount'] || 'N/A'}"`);
    }
    
    // Debug market data transactions specifically
    if (transactionType === 'marketData') {
      console.log(`🔍 MARKET DATA PROCESSING: Symbol="${symbol}", Description="${description}", Amount="${row['Amount'] || 'N/A'}"`);
    }
    
    // Debug locate fee transactions specifically
    if (transactionType === 'locate') {
      console.log(`🔍 LOCATE FEE PROCESSING: Symbol="${symbol}", Description="${description}", Amount="${row['Amount'] || 'N/A'}"`);
    }
    
    // Extract date from description first (format: "10/13 C STOCK BORROW FEE GV")
    const dateFromDescription = extractDateFromDescription(description);
    
        // Get amount
        const amount = extractAmount(row);
        
        // Debug amount extraction for market data transactions
        if (transactionType === 'marketData') {
          console.log(`🔍 MARKET DATA AMOUNT: Raw Amount="${row['Amount']}", Extracted Amount=${amount}`);
        }
        
        // Debug amount extraction for locate fee transactions
        if (transactionType === 'locate') {
          console.log(`🔍 LOCATE FEE AMOUNT: Raw Amount="${row['Amount']}", Extracted Amount=${amount}`);
        }
        
        // For fee transactions (borrow fees, market data, etc.), negative amounts are normal
        // Only skip if amount is exactly zero or if it's a trading transaction with negative amount
        if (amount === 0 || (transactionType === 'trading' && amount < 0)) {
          console.log(`⚠️ Skipping row with zero amount or negative trading amount: ${amount} for ${symbol}`);
          if (transactionType === 'marketData') {
            console.log(`   Market Data transaction skipped! Raw data:`, row);
          }
          if (transactionType === 'locate') {
            console.log(`   Locate fee transaction skipped! Raw data:`, row);
          }
          continue;
        }
        
        // Use the statement date (Column A) for all transactions
        // For borrow fees, we'll match them to the original trade date later
        const finalDate = extractDate(row) || dateFromDescription || new Date().toISOString().split('T')[0];
    
        const transactionTypeNames = {
          'overnight': 'BORROW',
          'locate': 'LOCATE', 
          'marketData': 'MARKET DATA',
          'interest': 'INTEREST',
          'trading': 'TRADING'
        };
        
        console.log(`✅ Found ${transactionTypeNames[transactionType]} fee: ${symbol} = $${amount} on ${finalDate}`);
        
        // Debug: Flag unusually large amounts
        if (amount > 10000) {
          console.warn(`⚠️ UNUSUALLY LARGE FEE DETECTED: ${symbol} = $${amount} on ${finalDate}`);
          console.warn(`   Description: "${description}"`);
          console.warn(`   Transaction Type: ${transactionTypeNames[transactionType]}`);
          console.warn(`   Full row data:`, row);
        }
        
        // For borrow fees, find the most recent trade before this fee date
        // For trading transactions, use the exact date
        let targetDate = finalDate;
        
        if (transactionType === 'overnight' || transactionType === 'locate' || transactionType === 'marketData' || transactionType === 'interest') {
          // For fees, find the most recent trading date for this symbol that's before or on the fee date
          const symbolTrades = Array.from(tradingData.keys())
            .filter(key => key.startsWith(`${symbol}-`))
            .map(key => ({
              key,
              date: key.split('-')[1]
            }))
            .filter(trade => trade.date <= finalDate) // Only trades on or before the fee date
            .sort((a, b) => b.date.localeCompare(a.date)); // Sort descending (most recent first)
          
          if (symbolTrades.length > 0) {
            const mostRecentTrade = symbolTrades[0];
            targetDate = mostRecentTrade.date;
            console.log(`📊 Matching fee for ${symbol} to most recent trade: ${targetDate} (fee date was ${finalDate})`);
          } else {
            console.log(`⚠️ No prior trade found for ${symbol} fee on ${finalDate}, using fee date`);
          }
        }
        
        // Check if this symbol already exists for this target date
        const existingIndex = positions.findIndex(
          p => p.symbol === symbol && p.date === targetDate
        );
        
        // Get trading data for this symbol and target date
        const key = `${symbol}-${targetDate}`;
        const tradingInfo = tradingData.get(key) || { pnl: 0, quantity: 0, value: 0 };
        
        console.log(`🔗 Looking for trading data with key: ${key}`);
        console.log(`   Found trading data: P&L=${tradingInfo.pnl}, Qty=${tradingInfo.quantity}, Value=${tradingInfo.value}`);
        
        if (existingIndex >= 0) {
          // Add to existing position
          // Use absolute value for fees since they're typically negative amounts (debits)
          const feeAmount = Math.abs(amount);
          switch (transactionType) {
            case 'overnight':
              positions[existingIndex].overnightFee += feeAmount;
              break;
            case 'locate':
              positions[existingIndex].locateCost += feeAmount;
              break;
            case 'marketData':
              positions[existingIndex].marketDataFee += feeAmount;
              break;
            case 'interest':
              positions[existingIndex].interestFee += feeAmount;
              break;
            case 'trading':
              // For trading transactions, we don't add to fees, but we update P&L
              // The amount here is the transaction value, not P&L
              // P&L will be calculated from the trading flow (buy/sell pairs)
              break;
          }
          
          // Add additional fees to existing position
          positions[existingIndex].commissions += extractCommissions(row);
          positions[existingIndex].rebates += extractRebates(row);
          positions[existingIndex].miscFees += extractMiscFees(row);
          
          // Debug: Log fee column values for trading transactions
          if (transactionType === 'trading') {
            console.log(`🔍 TRADING FEES - Symbol: ${symbol}, TransFee: ${row['TransFee']}, ORFFee: ${row['ORFFee']}, SECFee: ${row['SECFee']}, ECNTaker: ${row['ECNTaker']}`);
          }
          
          // Update trading data if not already set
          if (!positions[existingIndex].pnl && tradingInfo.pnl !== 0) {
            positions[existingIndex].pnl = tradingInfo.pnl;
            positions[existingIndex].quantity = tradingInfo.quantity;
            positions[existingIndex].value = tradingInfo.value;
            console.log(`   ✅ Updated existing position ${symbol} with P&L: ${tradingInfo.pnl}`);
          }
        } else {
          // Extract additional fees from columns
          const commissions = extractCommissions(row);
          const rebates = extractRebates(row);
          const miscFees = extractMiscFees(row);
          
          // Debug: Log fee column values for trading transactions
          if (transactionType === 'trading') {
            console.log(`🔍 NEW TRADING FEES - Symbol: ${symbol}, TransFee: ${row['TransFee']}, ORFFee: ${row['ORFFee']}, SECFee: ${row['SECFee']}, ECNTaker: ${row['ECNTaker']}`);
          }
          
          // Create new position
          // Use absolute value for fees since they're typically negative amounts (debits)
          const feeAmount = Math.abs(amount);
          positions.push({
            symbol,
            date: targetDate,
            quantity: tradingInfo.quantity,
            overnightFee: transactionType === 'overnight' ? feeAmount : 0,
            locateCost: transactionType === 'locate' ? feeAmount : 0,
            marketDataFee: transactionType === 'marketData' ? feeAmount : 0,
            interestFee: transactionType === 'interest' ? feeAmount : 0,
            otherFees: 0, // No longer processing 'other' transactions
            commissions,
            rebates,
            miscFees,
            borrowRate: 0,
            value: tradingInfo.value,
            pnl: transactionType === 'trading' ? 0 : tradingInfo.pnl, // P&L calculated separately
            transactionType,
            buySell: transactionType === 'trading' ? extractBuySell(row) : undefined,
            price: transactionType === 'trading' ? extractPrice(row) : undefined,
          });
          console.log(`   ✅ Created new position ${symbol} with P&L: ${tradingInfo.pnl}`);
        }
  }

      // Calculate P&L from buy/sell pairs
      calculatePositionPnL(positions, rawData);
      
      console.log(`✅ Skipped ${cashRowsSkipped} Cash transactions (Type = 'Cash')`);

      if (positions.length === 0) {
        const columns = rawData.length > 0 ? Object.keys(rawData[0]).join(', ') : 'none found';
        const sampleDescriptions = rawData.slice(0, 5).map(row => row['Description'] || 'N/A').join(', ');
        
        throw new Error(
          `No data found in the statement.\n\n` +
          `Columns found: ${columns}\n\n` +
          `Sample descriptions: ${sampleDescriptions}\n\n` +
          `Please check the browser console for more details.`
        );
      }

  // Calculate summary
  const summary = calculateSummary(positions);
  
      // Debug: Show final positions with P&L
      console.log('📋 Final positions summary:');
      let totalPnL = 0;
      let positionsWithPnL = 0;
      let bgmsPositions = 0;
      for (const pos of positions) {
        if (pos.pnl && pos.pnl !== 0) {
          totalPnL += pos.pnl;
          positionsWithPnL++;
          console.log(`  ${pos.symbol} (${pos.date}): P&L=${pos.pnl}, Overnight=${pos.overnightFee}, Locate=${pos.locateCost}`);
        }
        if (pos.symbol === 'BGMS') {
          bgmsPositions++;
          console.log(`🐍 BGMS Position: ${pos.date}, Type: ${pos.transactionType}, P&L: ${pos.pnl}, Fees: ${pos.overnightFee + pos.locateCost}`);
        }
      }
      console.log(`📊 Total P&L from positions: ${totalPnL}`);
      console.log(`📊 Positions with P&L data: ${positionsWithPnL}/${positions.length}`);
      console.log(`🐍 BGMS positions found: ${bgmsPositions}`);
      
      // Debug: Show fee breakdown by type
      const feeBreakdown = {
        overnight: positions.reduce((sum, p) => sum + p.overnightFee, 0),
        locate: positions.reduce((sum, p) => sum + p.locateCost, 0),
        marketData: positions.reduce((sum, p) => sum + p.marketDataFee, 0),
        interest: positions.reduce((sum, p) => sum + p.interestFee, 0),
        other: positions.reduce((sum, p) => sum + p.otherFees, 0),
        commissions: positions.reduce((sum, p) => sum + p.commissions, 0),
        rebates: positions.reduce((sum, p) => sum + p.rebates, 0),
        miscFees: positions.reduce((sum, p) => sum + p.miscFees, 0),
      };
      
      console.log('💰 FEE BREAKDOWN BY TYPE:');
      console.log(`   Overnight Fees: $${feeBreakdown.overnight.toFixed(2)}`);
      console.log(`   Locate Costs: $${feeBreakdown.locate.toFixed(2)}`);
      console.log(`   Market Data: $${feeBreakdown.marketData.toFixed(2)}`);
      console.log(`   Interest (Column E with % or Description): $${feeBreakdown.interest.toFixed(2)}`);
      console.log(`   Other Fees: $${feeBreakdown.other.toFixed(2)}`);
      console.log(`   Commissions: $${feeBreakdown.commissions.toFixed(2)}`);
      console.log(`   Rebates: $${feeBreakdown.rebates.toFixed(2)}`);
      console.log(`   Misc Fees (TAF + CAT): $${feeBreakdown.miscFees.toFixed(2)}`);
      console.log(`   TOTAL FEES: $${(feeBreakdown.overnight + feeBreakdown.locate + feeBreakdown.marketData + feeBreakdown.interest + feeBreakdown.other + feeBreakdown.commissions + feeBreakdown.miscFees).toFixed(2)}`);
      console.log(`   TOTAL REBATES: $${feeBreakdown.rebates.toFixed(2)}`);
      console.log(`   NET FEES (after rebates): $${(feeBreakdown.overnight + feeBreakdown.locate + feeBreakdown.marketData + feeBreakdown.interest + feeBreakdown.other + feeBreakdown.commissions + feeBreakdown.miscFees - feeBreakdown.rebates).toFixed(2)}`);
      
      // Debug: Show P&L breakdown
      console.log('\n📊 P&L BREAKDOWN:');
      console.log(`   Total P&L from positions: $${totalPnL.toFixed(2)}`);
      console.log(`   Positions with P&L data: ${positionsWithPnL}/${positions.length}`);
      console.log(`   Net P&L (after fees): $${(totalPnL - (feeBreakdown.overnight + feeBreakdown.locate + feeBreakdown.marketData + feeBreakdown.interest + feeBreakdown.other)).toFixed(2)}`);
      
      // Show individual P&L entries for debugging
      console.log('\n🔍 INDIVIDUAL P&L ENTRIES:');
      positions.forEach((pos, index) => {
        if (pos.pnl && pos.pnl !== 0) {
          console.log(`   ${index + 1}. ${pos.symbol} (${pos.date}): P&L=$${pos.pnl.toFixed(2)}`);
        }
      });
  
  // If still no P&L, let's check what we actually have
  if (totalPnL === 0) {
    console.warn('❌ NO P&L DATA FOUND IN POSITIONS!');
    console.log('🔍 Let\'s check what trading data we collected:');
    for (const [key, data] of tradingData.entries()) {
      if (data.pnl !== 0) {
        console.log(`  Trading data ${key}: P&L=${data.pnl}`);
      }
    }
    
    // Let's also check if we have any positions at all
    console.log(`🔍 Total positions created: ${positions.length}`);
    if (positions.length > 0) {
      console.log('🔍 Sample position (first one):');
      const firstPos = positions[0];
      console.log(`  Symbol: ${firstPos.symbol}, Date: ${firstPos.date}, P&L: ${firstPos.pnl}, Overnight: ${firstPos.overnightFee}, Locate: ${firstPos.locateCost}`);
    }
  }
  
  console.log('🔍 SECOND PASS COMPLETED - All borrow fee processing finished');
  console.log(`🔍 BORROW FEE SUMMARY: ${borrowFeeRowsFound} borrow fee transactions found in second pass`);
  console.log(`🔍 PROCESSING SUMMARY: Processed ${rawData.length} total rows in second pass`);
  console.log(`🔍 FINAL RESULT: ${positions.length} positions created`);
  
  // Debug: Show breakdown of position types
  const locatePositions = positions.filter(p => p.locateCost > 0);
  const overnightPositions = positions.filter(p => p.overnightFee > 0);
  const marketDataPositions = positions.filter(p => p.marketDataFee > 0);
  
  console.log(`🔍 POSITION BREAKDOWN:`);
  console.log(`   - Positions with locate fees: ${locatePositions.length}`);
  console.log(`   - Positions with overnight fees: ${overnightPositions.length}`);
  console.log(`   - Positions with market data fees: ${marketDataPositions.length}`);
  
  // Extract period from filename or data
  const period = extractPeriod(fileName);

      return {
        fileName,
        uploadDate: new Date(),
        period,
        totalOvernightFees: Math.round(positions.reduce((sum, p) => sum + p.overnightFee, 0) * 100) / 100,
        totalLocateCosts: Math.round(positions.reduce((sum, p) => sum + p.locateCost, 0) * 100) / 100,
        totalMarketDataFees: Math.round(positions.reduce((sum, p) => sum + p.marketDataFee, 0) * 100) / 100,
        totalInterestFees: Math.round(positions.reduce((sum, p) => sum + p.interestFee, 0) * 100) / 100,
        totalOtherFees: Math.round(positions.reduce((sum, p) => sum + p.otherFees, 0) * 100) / 100,
        totalCommissions: Math.round(positions.reduce((sum, p) => sum + p.commissions, 0) * 100) / 100,
        totalRebates: Math.round(positions.reduce((sum, p) => sum + p.rebates, 0) * 100) / 100,
        totalMiscFees: Math.round(positions.reduce((sum, p) => sum + p.miscFees, 0) * 100) / 100,
        positions,
        summary,
      };
}

function extractSymbol(row: Record<string, unknown>): string {
  // Prioritize Column D (index 3) as per user feedback
  const columnNames = Object.keys(row);
  if (columnNames.length > 3) {
    const columnDKey = columnNames[3];
    const value = String(row[columnDKey]).trim();
    if (/^[A-Z]{1,5}[0-9]?$/.test(value)) {
      console.log(`✅ Found symbol in Column D (${columnDKey}): ${value}`);
      return value;
    }
  }

  const symbolKeys = ['Symbol', 'Ticker', 'Stock', 'Security'];
  for (const key of symbolKeys) {
    if (row[key]) return String(row[key]).trim().toUpperCase();
  }
  // Try first column if no match
  const firstValue = Object.values(row)[0];
  return firstValue ? String(firstValue).trim().toUpperCase() : '';
}

function extractDate(row: Record<string, unknown>): string | null {
  const dateKeys = ['Date', 'Trade Date', 'Settlement Date', 'Transaction Date', 'Trade Date/Time', 'Settlement'];
  for (const key of dateKeys) {
    if (row[key]) {
      const dateStr = String(row[key]);

      // Handle MM/DD/YYYY format
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
        const parts = dateStr.split('/');
        const month = parts[0].padStart(2, '0');
        const day = parts[1].padStart(2, '0');
        const year = parts[2];
        return `${year}-${month}-${day}`;
      }

      // Handle YYYY-MM-DD format
      if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(dateStr)) {
        return dateStr;
      }

      // Handle Excel serial date numbers (like 45943, 45944)
      const numValue = parseFloat(dateStr);
      if (!isNaN(numValue) && numValue > 40000) { // Excel dates are typically > 40000
        // Excel serial date to JavaScript date conversion
        // Excel epoch is January 1, 1900, JavaScript epoch is January 1, 1970
        // Excel has a bug where it considers 1900 a leap year, so we need to adjust
        const excelEpoch = new Date(1900, 0, 1);
        const jsDate = new Date(excelEpoch.getTime() + (numValue - 2) * 24 * 60 * 60 * 1000);
        if (!isNaN(jsDate.getTime())) {
          return jsDate.toISOString().split('T')[0];
        }
      }

      // Try to parse as date
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
  }
  return null;
}


function extractDescription(row: Record<string, unknown>): string {
  const descKeys = ['Description', 'Desc', 'Description/Details', 'Details', 'Transaction', 'Transaction Type'];
  for (const key of descKeys) {
    if (row[key]) return String(row[key]).trim();
  }
  // Try any column that might be description-like
  for (const [key, value] of Object.entries(row)) {
    if (key.toLowerCase().includes('desc') || key.toLowerCase().includes('detail')) {
      return String(value).trim();
    }
  }
  return '';
}

function extractSymbolFromDescription(description: string): string {
  // Format: "10/13 C STOCK BORROW FEE GV" or "10/10 STOCK BORROW FEE QMMM"
  // Symbol is the last word
  const parts = description.trim().split(/\s+/);
  const lastPart = parts[parts.length - 1];
  
  // Check if it looks like a symbol (1-5 uppercase letters, may have numbers)
  if (/^[A-Z]{1,5}[0-9]?$/.test(lastPart)) {
    return lastPart;
  }
  
  // Also try to extract symbol from Column D if description doesn't have it
  return '';
}

function extractDateFromDescription(description: string): string | null {
  // Format: "10/13 C STOCK BORROW FEE GV" or "10/10 STOCK BORROW FEE QMMM"
  // Date is at the beginning
  const parts = description.trim().split(/\s+/);
  const firstPart = parts[0];
  
  // Check if first part is a date in MM/DD format
  if (/^\d{1,2}\/\d{1,2}$/.test(firstPart)) {
    const [month, day] = firstPart.split('/');
    const currentYear = new Date().getFullYear();
    
    // Try to determine the year (assume current year or previous year)
    const date = new Date(currentYear, parseInt(month) - 1, parseInt(day));
    
    // If the date is in the future, assume it's from the previous year
    if (date > new Date()) {
      date.setFullYear(currentYear - 1);
    }
    
    return date.toISOString().split('T')[0];
  }
  
  return null;
}

function extractAmount(row: Record<string, unknown>): number {
  // Try common amount/fee column names
  const amountKeys = [
    'Amount', 'Fee', 'Debit', 'Credit', 'Charge', 'Cost', 
    'Net Amount', 'Total', 'Value', 'Price', 'Fee Amount'
  ];
  
  for (const key of amountKeys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
      const value = String(row[key]).replace(/[^0-9.-]/g, '');
      const num = parseFloat(value);
      if (!isNaN(num) && num !== 0) return num; // Return actual amount (can be negative for fees)
    }
  }
  
  // Try any column with numeric value
  for (const [key, value] of Object.entries(row)) {
    if (value !== null && value !== undefined && value !== '') {
      const strValue = String(value).replace(/[^0-9.-]/g, '');
      const num = parseFloat(strValue);
      if (!isNaN(num) && num !== 0 && Math.abs(num) < 1000000) {
        console.log(`Found amount in column "${key}": ${num}`);
        return num; // Return actual amount (can be negative for fees)
      }
    }
  }
  
  return 0;
}

function extractPnL(_row: Record<string, unknown>): number {
  // P&L will be calculated from matched buy/sell pairs, not from individual transactions
  // Individual transactions just show the transaction value (shares × price), not profit
  // Using _row parameter to avoid ESLint warning
  void _row; // Explicitly mark as used
  return 0;
}

function extractQuantity(row: Record<string, unknown>): number {
  // Prioritize Column C (index 2) - Quantities
  const columnNames = Object.keys(row);
  if (columnNames.length > 2) {
    const columnC = columnNames[2];
    const value = String(row[columnC] || '').replace(/[^0-9.-]/g, '');
    const num = parseFloat(value);
    if (!isNaN(num) && num > 0) {
      console.log(`✅ Found quantity in Column C (${columnC}): ${num}`);
      return num;
    }
  }
  
  // Fallback: Try common quantity column names
  const quantityKeys = [
    'Quantity', 'Qty', 'Shares', 'Size', 'Volume', 'Amount'
  ];
  
  for (const key of quantityKeys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
      const value = String(row[key]).replace(/[^0-9.-]/g, '');
      const num = parseFloat(value);
      if (!isNaN(num) && num > 0) {
        return num;
      }
    }
  }
  
  return 0;
}

function extractValue(row: Record<string, unknown>): number {
  // Prioritize Column F (index 5) - Prices
  const columnNames = Object.keys(row);
  if (columnNames.length > 5) {
    const columnF = columnNames[5];
    const value = String(row[columnF] || '').replace(/[^0-9.-]/g, '');
    const num = parseFloat(value);
    if (!isNaN(num) && num > 0) {
      console.log(`✅ Found price in Column F (${columnF}): ${num}`);
      return Math.abs(num);
    }
  }
  
  // Fallback: Try common value column names
  const valueKeys = [
    'Value', 'Market Value', 'Notional', 'Amount', 'Price', 'Total Value'
  ];
  
  for (const key of valueKeys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
      const value = String(row[key]).replace(/[^0-9.-]/g, '');
      const num = parseFloat(value);
      if (!isNaN(num) && num > 0) {
        return Math.abs(num);
      }
    }
  }
  
  return 0;
}

function extractBuySell(row: Record<string, unknown>): string {
  // Get Column B (index 1) - Buy/Sell
  const columnNames = Object.keys(row);
  if (columnNames.length > 1) {
    const columnB = columnNames[1];
    const value = String(row[columnB] || '').trim();
    return value;
  }
  return '';
}

function extractPrice(row: Record<string, unknown>): number {
  // Get Column F (index 5) - Price
  const columnNames = Object.keys(row);
  if (columnNames.length > 5) {
    const columnF = columnNames[5];
    const value = String(row[columnF] || '').replace(/[^0-9.-]/g, '');
    const num = parseFloat(value);
    if (!isNaN(num) && num > 0) {
      return num;
    }
  }
  return 0;
}

function extractCommissions(row: Record<string, unknown>): number {
  // Get Column P (index 15) - Commissions
  const columnNames = Object.keys(row);
  if (columnNames.length > 15) {
    const commissionColumn = columnNames[15];
    const value = String(row[commissionColumn] || '').replace(/[^0-9.-]/g, '');
    const num = parseFloat(value);
    if (!isNaN(num)) {
      return Math.abs(num); // Make positive for consistency
    }
  }
  return 0;
}

function extractRebates(row: Record<string, unknown>): number {
  // Get Column I (index 8) - ECNMaker (rebates)
  const columnNames = Object.keys(row);
  if (columnNames.length > 8) {
    const rebateColumn = columnNames[8];
    const value = String(row[rebateColumn] || '').replace(/[^0-9.-]/g, '');
    const num = parseFloat(value);
    if (!isNaN(num)) {
      return Math.abs(num); // Make positive for consistency
    }
  }
  return 0;
}

function extractMiscFees(row: Record<string, unknown>): number {
  // Get Column K (index 10) - TAFFee and Column M (index 12) - CATFee
  const columnNames = Object.keys(row);
  let total = 0;
  
  // Column K - TAFFee
  if (columnNames.length > 10) {
    const tafColumn = columnNames[10];
    const tafValue = String(row[tafColumn] || '').replace(/[^0-9.-]/g, '');
    const tafNum = parseFloat(tafValue);
    if (!isNaN(tafNum)) {
      total += Math.abs(tafNum);
    }
  }
  
  // Column M - CATFee
  if (columnNames.length > 12) {
    const catColumn = columnNames[12];
    const catValue = String(row[catColumn] || '').replace(/[^0-9.-]/g, '');
    const catNum = parseFloat(catValue);
    if (!isNaN(catNum)) {
      total += Math.abs(catNum);
    }
  }
  
  return total;
}

function calculatePositionPnL(positions: BorrowPosition[], rawData: Record<string, unknown>[]): void {
  console.log('💰 Calculating P&L from buy/sell pairs...');
  
  // Group all trading transactions by symbol
  const tradesBySymbol = new Map<string, Array<{
    date: string;
    buySell: string;
    quantity: number;
    price: number;
    amount: number;
  }>>();

  for (const row of rawData) {
    // Skip all rows where Type (Column O, index 14) = "Cash"
    const columnNames = Object.keys(row);
    if (columnNames.length > 14) {
      const typeColumn = columnNames[14]; // Column O - Type
      const typeValue = String(row[typeColumn] || '').trim();
      if (typeValue === 'Cash') {
        continue;
      }
    }
    
    const description = extractDescription(row);
    
    // Skip non-trading transactions
    if (description.includes('STOCK BORROW FEE') || 
        description.includes('MARKET DATA') || 
        description.includes('INTEREST') ||
        description.includes('MARK TO MARKET') ||
        description.includes('ACH')) {
      continue;
    }

    const symbol = extractSymbol(row) || extractSymbolFromDescription(description);
    const buySell = extractBuySell(row);
    const quantity = Math.abs(extractQuantity(row));
    const price = extractPrice(row);
    const date = extractDate(row) || '';
    
    // Get the Amount column (transaction value)
    const cols = Object.keys(row);
    const amountColumn = cols.length > 13 ? cols[13] : '';
    const amountStr = String(row[amountColumn] || '').replace(/[^0-9.-]/g, '');
    const amount = parseFloat(amountStr);

    if (symbol && quantity > 0 && price > 0 && !isNaN(amount)) {
      if (!tradesBySymbol.has(symbol)) {
        tradesBySymbol.set(symbol, []);
      }
      tradesBySymbol.get(symbol)!.push({
        date,
        buySell,
        quantity,
        price,
        amount
      });
    }
  }

  // Calculate P&L for each symbol
  for (const [symbol, trades] of tradesBySymbol.entries()) {
    // Sort trades by date
    trades.sort((a, b) => a.date.localeCompare(b.date));
    
    let totalPnL = 0;
    
    // Simple P&L calculation: sum of all amounts (sells are positive, buys are negative)
    for (const trade of trades) {
      totalPnL += trade.amount;
    }
    
    // Find the earliest position for this symbol and update its P&L
    const positionIndex = positions.findIndex(p => p.symbol === symbol);
    if (positionIndex >= 0) {
      positions[positionIndex].pnl = Math.round(totalPnL * 100) / 100;
      console.log(`💵 ${symbol}: Calculated P&L = $${totalPnL.toFixed(2)} (${trades.length} trades)`);
    }
  }
  
  console.log('✅ P&L calculation complete');
}


function extractPeriod(fileName: string): string {
  // Try to extract date from filename (e.g., "cobra_statement_2024_10.pdf")
  const dateMatch = fileName.match(/(\d{4})[-_](\d{1,2})/);
  if (dateMatch) {
    const year = dateMatch[1];
    const month = dateMatch[2].padStart(2, '0');
    return `${year}-${month}`;
  }
  
  // Default to current month
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function calculateSummary(positions: BorrowPosition[]): FeeSummary {
  // Interest is INCOME, not a fee, so don't include it in totalFees
  const totalFees = positions.reduce((sum, p) => 
    sum + p.overnightFee + p.locateCost + p.marketDataFee + p.otherFees + p.commissions + p.miscFees, 0);
  const totalOvernightFees = positions.reduce((sum, p) => sum + p.overnightFee, 0);
  const totalRebates = positions.reduce((sum, p) => sum + p.rebates, 0);
  const totalInterest = positions.reduce((sum, p) => sum + p.interestFee, 0);
  const totalPnL = positions.reduce((sum, p) => sum + (p.pnl || 0), 0);
  
  // Find unique dates to calculate daily average
  const uniqueDates = new Set(positions.map(p => p.date));
  const daysAnalyzed = uniqueDates.size || 1;
  
  // Find most expensive symbol (exclude interest since it's income)
  const symbolFees = new Map<string, number>();
  for (const pos of positions) {
    const current = symbolFees.get(pos.symbol) || 0;
    symbolFees.set(pos.symbol, Math.round((current + pos.overnightFee + pos.locateCost + pos.marketDataFee + pos.otherFees + pos.commissions + pos.miscFees) * 100) / 100);
  }
  
  let mostExpensiveSymbol = '';
  let mostExpensiveFee = 0;
  for (const [symbol, fee] of symbolFees.entries()) {
    if (fee > mostExpensiveFee) {
      mostExpensiveFee = fee;
      mostExpensiveSymbol = symbol;
    }
  }

  // Calculate P&L metrics
  // Net fees = total fees - rebates - interest (since interest and rebates are income)
  const netFees = totalFees - totalRebates - totalInterest;
  const netPnL = totalPnL - netFees;
  const feeToProfitRatio = totalPnL > 0 ? (netFees / totalPnL) * 100 : 0;

  return {
    totalFees: Math.round(totalFees * 100) / 100,
    avgDailyOvernightCost: Math.round((totalOvernightFees / daysAnalyzed) * 100) / 100,
    mostExpensiveSymbol,
    mostExpensiveFee: Math.round(mostExpensiveFee * 100) / 100,
    daysAnalyzed,
    totalPositions: positions.length,
    totalPnL: Math.round(totalPnL * 100) / 100,
    netPnL: Math.round(netPnL * 100) / 100,
    feeToProfitRatio: Math.round(feeToProfitRatio * 100) / 100,
  };
}

