# Bank Zero Integration Documentation

This document describes the implementation and usage of the Bank Zero statement processing functionality within the JB3AI Command Centre.

## Overview

The Bank Zero integration allows users to upload Bank Zero CSV or PDF statements and automatically categorize transactions against existing subscriptions. This functionality streamlines financial management by reducing manual data entry and providing automated reconciliation.

## Architecture

### Components

1. **BankZeroUploader Component** (`src/pages/subscriptions/components/BankZeroUploader.tsx`)
   - Provides the user interface for file uploads
   - Handles drag-and-drop functionality
   - Manages upload state and user feedback
   - Displays processing results

2. **BankZeroParser Utility** (`src/lib/bankzero-parser.ts`)
   - Parses CSV content from Bank Zero statements
   - Normalizes transaction descriptions for matching
   - Matches transactions to subscriptions
   - Provides type definitions for transaction data

### Data Flow

1. User uploads a Bank Zero statement (CSV/PDF)
2. File is read and parsed by the BankZeroParser
3. Transactions are extracted and normalized
4. Subscription data is fetched from Supabase
5. Transactions are matched against subscription names
6. Results are displayed to the user with statistics
7. Unmatched transactions require manual review

## Implementation Details

### File Format Support

The system supports:
- CSV files (standard Bank Zero export format)
- PDF files (with basic text extraction)

### Parsing Logic

The BankZeroParser handles:
- Standard Bank Zero CSV format with date, description, amount, and type columns
- Proper parsing of numeric amounts and dates
- Different transaction types (credit/debit)
- Case-insensitive matching for better accuracy
- Normalization of descriptions to improve matching

### Matching Algorithm

The matching algorithm:
1. Normalizes transaction descriptions
2. Performs fuzzy matching against subscription names
3. Assigns matched subscriptions to transactions
4. Flags unmatched transactions for manual review

## Usage

### Uploading Statements

1. Navigate to the Subscriptions page
2. Click the "Import Statement" button
3. Drag and drop or click to select a Bank Zero CSV/PDF file
4. Wait for processing to complete
5. Review the results in the processing summary

### Reviewing Results

The system displays:
- Total transaction count
- Matched transaction count
- Unmatched transaction count
- Preview tables for both matched and unmatched transactions
- Detailed information about each transaction

## Technical Specifications

### Data Types

```typescript
interface BankZeroTransaction {
  transactionDate: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  matchedSubscriptionId?: string;
}

interface Subscription {
  id: string;
  name: string;
}
```

### API Endpoints

- `POST /api/bankzero/upload` - Upload and process Bank Zero statements
- `GET /api/bankzero/results/:statementId` - Retrieve processing results

## Security Considerations

- Files are processed client-side for privacy
- No sensitive data is transmitted to external services
- All processing happens within the browser environment
- File type validation prevents malicious uploads

## Performance Optimizations

- Lazy loading of components
- Efficient matching algorithms
- Pagination for large result sets
- Caching of subscription data

## Future Enhancements

1. Enhanced matching with machine learning
2. Support for additional bank statement formats
3. Automated categorization suggestions
4. Integration with accounting software
5. Export functionality for processed data