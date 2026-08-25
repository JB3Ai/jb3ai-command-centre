# Subscriptions Module

This module provides a comprehensive dashboard for managing subscriptions, expenses, and income streams within the JB3AI Command Centre.

## Features

- **Key Metrics Overview**: Displays critical financial metrics at a glance
- **Tabbed Interface**: Multiple views for different subscription management needs
- **Subscription Management**: Full CRUD operations for subscriptions
- **Bank Zero Integration**: Automated statement processing and transaction matching
- **Email Ingestion Tracking**: Monitor invoices automatically detected from emails
- **Responsive Design**: Works across desktop and mobile devices

## Architecture

### File Structure
```
src/
└── pages/
    └── subscriptions/
        ├── index.tsx           # Main dashboard component
        ├── components/
        │   └── BankZeroUploader.tsx  # Bank Zero integration component
        └── README.md           # This documentation file
```

### Data Flow
1. Fetch subscriptions from Supabase database
2. Process and group subscriptions by category
3. Display in tabbed interface with key metrics
4. Handle user interactions (add, edit, delete, pause)
5. Integrate with Bank Zero for statement processing
6. Track email-based invoice detection

## Installation

### Prerequisites
- Supabase account with configured `hub_subscriptions` table
- Proper environment variables set for database connection
- Node.js 18+ and npm 8+

### Setup
```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

## Usage

### Accessing the Dashboard
Navigate to `/subscriptions` in the command centre to access the dashboard.

### Key Features

#### 1. Key Metrics
The dashboard displays essential financial metrics:
- Monthly Outflow: Total monthly expenses
- Monthly Inflow: Total monthly income
- Net Balance: Difference between inflow and outflow
- Active Subscriptions: Count of currently active subscriptions
- Total Subscriptions: Overall count of all subscriptions

#### 2. Tab Navigation
Switch between different views using the tab bar:
- **All Subscriptions**: Complete list of all subscriptions
- **Incoming (MRR)**: Revenue-generating subscriptions only
- **Outgoing (SaaS/Bills)**: Expense subscriptions only
- **Active**: Only active subscriptions
- **Paused**: Only paused subscriptions
- **Bank Zero Sync**: Integration with Bank Zero statement processing
- **Email Ingestion**: Tracking of email-based invoice detection

#### 3. Subscription Management
- **Add Subscription**: Click the "Add Subscription" button to open the modal
- **View Details**: Click the eye icon on any subscription
- **Edit Subscription**: Click the edit icon to modify details
- **Delete Subscription**: Click the trash icon to remove a subscription
- **Pause/Resume**: Toggle subscription status with play/pause icons

#### 4. Bank Zero Integration
- **Upload Statements**: Drag and drop or click to upload Bank Zero CSV/PDF files
- **Process Transactions**: Automatically match transactions to subscriptions
- **Review Matches**: Check matched/unmatched transactions in the dashboard
- **Recent Statements**: View history of processed statements

#### 5. Email Ingestion Tracking
- **Invoice Detection**: Automatically tracks invoices from email
- **Status Monitoring**: Shows processing status of each invoice
- **Quick Access**: Direct links to view invoice details

## API Endpoints

### Subscription Management
- `GET /api/subscriptions` - Fetch all subscriptions
- `POST /api/subscriptions` - Create new subscription
- `PUT /api/subscriptions/:id` - Update subscription
- `DELETE /api/subscriptions/:id` - Delete subscription

### Bank Zero Integration
- `POST /api/bankzero/upload` - Upload and process Bank Zero statements
- `GET /api/bankzero/statements` - Retrieve recent statements
- `GET /api/bankzero/transactions` - Retrieve unlinked transactions

## Configuration

### Environment Variables
```bash
# Supabase configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Database Schema
The `hub_subscriptions` table should have the following columns:
- `id` (UUID) - Primary key
- `service_name` (TEXT) - Name of the service
- `category` (TEXT) - Category for grouping
- `monthly_zar` (NUMERIC) - Monthly cost in ZAR
- `monthly_usd` (NUMERIC) - Monthly cost in USD
- `billing_cycle` (TEXT) - Billing frequency
- `status` (TEXT) - Subscription status
- `renewal_date` (DATE) - Next renewal date
- `payment_method` (TEXT) - Payment method used
- `notes` (TEXT) - Additional notes
- `tier` (TEXT) - Service tier
- `direction` (TEXT) - IN for income, OUT for expenses
- `email_tag` (TEXT) - Associated email tag
- `created_at` (TIMESTAMP) - Creation timestamp
- `updated_at` (TIMESTAMP) - Last update timestamp

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests for new functionality
5. Submit a pull request

## License

MIT License

## Support

For issues or feature requests, please open an issue in the repository.