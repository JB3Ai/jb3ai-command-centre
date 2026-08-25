# Library Utilities

This directory contains shared utility functions and components used throughout the application.

## Bank Zero Parser

The Bank Zero parser utility (`bankzero-parser.ts`) provides functionality for parsing Bank Zero CSV statements and matching transactions to subscriptions.

### Features

- CSV parsing for Bank Zero statement formats
- Transaction object creation from CSV data
- Smart matching of transaction descriptions to subscription names
- Support for both credit and debit transactions

### Functions

#### `parseBankZeroCSV(csvContent: string): BankZeroTransaction[]`

Parses CSV content from a Bank Zero statement and returns an array of transaction objects.

#### `matchTransactionsToSubscriptions(transactions: BankZeroTransaction[], subscriptions: Subscription[]): BankZeroTransaction[]`

Matches transactions to existing subscriptions based on description similarity.

#### `normalizeDescription(description: string): string`

Normalizes transaction descriptions for better matching.

### Data Structures

#### `BankZeroTransaction`

```typescript
interface BankZeroTransaction {
  transactionDate: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  matchedSubscriptionId?: string;
}
```

#### `Subscription`

```typescript
interface Subscription {
  id: string;
  name: string;
}
```

### Usage

```typescript
import { parseBankZeroCSV, matchTransactionsToSubscriptions } from '@/lib/bankzero-parser';

const csvContent = '...'; // CSV content from Bank Zero
const transactions = parseBankZeroCSV(csvContent);
const subscriptions = await supabase.from('subscriptions').select('*');
const matchedTransactions = matchTransactionsToSubscriptions(transactions, subscriptions);
```

### Implementation Details

The parser handles:
- Standard Bank Zero CSV format with date, description, amount, and type columns
- Proper parsing of numeric amounts and dates
- Different transaction types (credit/debit)
- Case-insensitive matching for better accuracy
- Normalization of descriptions to improve matching