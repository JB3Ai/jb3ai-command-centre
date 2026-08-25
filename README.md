# JB3AI Command Centre

This is the main command centre application for managing subscriptions, integrations, and business intelligence.

## Project Structure

```
src/
├── pages/
│   └── subscriptions/
│       ├── index.tsx           # Main subscriptions page
│       ├── components/
│       │   └── BankZeroUploader.tsx  # Bank Zero statement uploader
│       └── README.md           # Subscriptions module documentation
├── lib/
│   ├── bankzero-parser.ts      # Bank Zero CSV parsing utilities
│   └── README.md               # Library utilities documentation
└── ...
```

## Key Features

### Subscriptions Management
- View all subscriptions organized by category
- See subscription status, monthly cost, and renewal dates
- Summary statistics showing total, active, and cancelled subscriptions

### Bank Zero Integration
- Drag-and-drop file upload for Bank Zero CSV/PDF statements
- Automatic transaction parsing and categorization
- Smart matching of transactions to existing subscriptions
- Detailed processing results with unmatched transaction review

## New Components

### BankZeroUploader Component
Located at `src/pages/subscriptions/components/BankZeroUploader.tsx`, this component provides:
- File upload interface with drag-and-drop support
- CSV/PDF parsing for Bank Zero statements
- Transaction matching against existing subscriptions
- Visual display of processing results
- Statistics and summaries

### BankZeroParser Utility
Located at `src/lib/bankzero-parser.ts`, this utility provides:
- CSV parsing functions for Bank Zero format
- Transaction matching algorithms
- Description normalization for better matching
- Type definitions for transaction data

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

## Building

```bash
npm run build
```

## API Endpoints

- `/api/subscriptions` - Manage subscription data
- `/api/bankzero` - Process Bank Zero statements

## Database Schema

The application uses Supabase for data storage with the following key tables:
- `hub_subscriptions` - Subscription data
- `bankzero_statements` - Processed Bank Zero statements
- `bankzero_transactions` - Individual transaction records

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
