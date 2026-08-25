/**
 * Bank Zero Statement Parser
 * Parses CSV exports from Bank Zero and converts them into standardized transaction format
 */

export interface BankZeroTransaction {
  id?: string;
  statementId?: string;
  transactionDate: string;
  description: string;
  amount: number;
  balance?: string;
  reference?: string;
  type: 'debit' | 'credit';
  matchedSubscriptionId?: string;
  isReconciled: boolean;
}

export interface ParsedStatement {
  fileName: string;
  periodStart: string;
  periodEnd: string;
  transactions: BankZeroTransaction[];
}

/**
 * Parse CSV content from Bank Zero
 * @param csvContent Raw CSV content from Bank Zero export
 * @returns Parsed transactions with standardized format
 */
export function parseBankZeroCSV(csvContent: string): BankZeroTransaction[] {
  if (!csvContent.trim()) {
    return [];
  }

  const lines = csvContent.split('\n').filter(line => line.trim() !== '');
  
  // Skip header row if present
  const dataLines = lines.slice(1);
  
  const transactions: BankZeroTransaction[] = [];
  
  for (const line of dataLines) {
    const fields = parseCSVLine(line);
    
    // Expected fields: Date, Description, Amount, Balance, Reference
    if (fields.length >= 3) {
      const [dateStr, description, amountStr, balance, reference] = fields;
      
      // Parse date (assuming format like "2023-01-15")
      const transactionDate = dateStr.trim();
      
      // Parse amount (should be numeric)
      const amount = parseFloat(amountStr.replace(/,/g, '').trim());
      
      // Determine if it's a credit or debit
      let type: 'debit' | 'credit' = 'debit';
      let standardizedAmount = Math.abs(amount);
      
      // If amount is positive, it's a credit (income)
      if (amount > 0) {
        type = 'credit';
        standardizedAmount = amount;
      }
      
      // If amount is negative, it's a debit (expense)
      if (amount < 0) {
        type = 'debit';
        standardizedAmount = Math.abs(amount);
      }
      
      // Create transaction object
      const transaction: BankZeroTransaction = {
        transactionDate,
        description: description.trim(),
        amount: standardizedAmount,
        balance: balance?.trim(),
        reference: reference?.trim(),
        type,
        isReconciled: false
      };
      
      transactions.push(transaction);
    }
  }
  
  return transactions;
}

/**
 * Parse a single CSV line, handling quoted fields properly
 * @param line CSV line to parse
 * @returns Array of field values
 */
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let currentField = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        // Escaped quote
        currentField += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator outside quotes
      fields.push(currentField);
      currentField = '';
    } else {
      // Regular character
      currentField += char;
    }
  }
  
  // Add last field
  fields.push(currentField);
  
  return fields;
}

/**
 * Fuzzy match transaction description against subscription names
 * @param transactionDescription Description from transaction
 * @param subscriptionName Name from subscription
 * @returns Match score (higher is better)
 */
export function fuzzyMatchDescription(transactionDescription: string, subscriptionName: string): number {
  if (!transactionDescription || !subscriptionName) {
    return 0;
  }
  
  const desc = transactionDescription.toLowerCase().trim();
  const name = subscriptionName.toLowerCase().trim();
  
  // Exact match gets highest score
  if (desc === name) {
    return 100;
  }
  
  // Partial match gets moderate score
  if (desc.includes(name) || name.includes(desc)) {
    return 80;
  }
  
  // Word-based matching
  const descWords = desc.split(/\s+/);
  const nameWords = name.split(/\s+/);
  
  let matchScore = 0;
  let totalWords = Math.max(descWords.length, nameWords.length);
  
  // Count matching words
  for (const word of descWords) {
    if (nameWords.includes(word)) {
      matchScore += 10;
    }
  }
  
  // Bonus for partial matches
  for (const word of descWords) {
    for (const nameWord of nameWords) {
      if (word.length > 2 && nameWord.includes(word)) {
        matchScore += 5;
      }
    }
  }
  
  // Normalize score
  return Math.min(100, (matchScore / totalWords) * 10);
}

/**
 * Match transactions to subscriptions based on description
 * @param transactions Transactions to match
 * @param subscriptions Available subscriptions
 * @param matchThreshold Minimum match score threshold
 * @returns Transactions with matched subscription IDs
 */
export function matchTransactionsToSubscriptions(
  transactions: BankZeroTransaction[], 
  subscriptions: { id: string; name: string }[],
  matchThreshold: number = 70
): BankZeroTransaction[] {
  return transactions.map(transaction => {
    let bestMatch: { id: string; name: string; score: number } | null = null;
    
    // Find best matching subscription
    for (const subscription of subscriptions) {
      const score = fuzzyMatchDescription(transaction.description, subscription.name);
      
      if (score >= matchThreshold && (!bestMatch || score > bestMatch.score)) {
        bestMatch = {
          id: subscription.id,
          name: subscription.name,
          score
        };
      }
    }
    
    // If we found a good match, update the transaction
    if (bestMatch) {
      return {
        ...transaction,
        matchedSubscriptionId: bestMatch.id,
        isReconciled: true
      };
    }
    
    return transaction;
  });
}