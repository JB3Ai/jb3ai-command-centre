# Setup Guide for jb3ai-command-centre

## Prerequisites

Before running this project, you'll need:

1. **Node.js** (version 18 or higher)
2. **Git**
3. **Supabase Account** (free tier is sufficient)
4. **Vercel Account** (optional, for deployment)

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd jb3ai-command-centre
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory based on `.env.example`:

```bash
# Copy .env.example to .env.local
cp .env.example .env.local
```

Then update the following values:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous public key

### 4. Set Up Supabase

1. Create a new Supabase project
2. In the Supabase SQL Editor, run the following migrations:
   - `supabase/migrations/001_initial_os3_schema.sql`
   - `supabase/migrations/002_seed_creditors.sql`
   - `supabase/migrations/003_seed_integrations.sql`
   - `supabase/migrations/004_braveheart_documents.sql`

### 5. Run the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Project Structure Overview

- `src/` - Main source code
  - `components/` - Reusable UI components
  - `pages/` - Page-level components
  - `lib/` - Libraries and utilities
  - `assets/` - Static assets
- `supabase/migrations/` - Database schema migrations
- `scripts/` - Local utility scripts (Python-based document cataloging)

## Key Features

1. **Authentication**: Supabase-based authentication with magic links
2. **Multi-module Dashboard**: 
   - Home (overview)
   - BRAVEHEART (document management)
   - BankZero (financial management)
   - WhatsApp (communication bridge)
   - Subscriptions (service monitoring)
   - Ecosystem (service mapping)
   - Projects (activity tracking)
   - Chronicle (history/archiving)
   - Media, Marketing, News, Notes, Links (content management)
3. **Responsive UI**: Built with Tailwind CSS
4. **TypeScript**: Strong typing throughout

## Running the Python Script

The `scripts/braveheart_catalog.py` script catalogs documents in a local folder into Supabase:

1. Install Python dependencies:
```bash
pip install supabase pypdf python-docx python-dotenv --break-system-packages
```

2. Create `.env` in the scripts folder with:
   - `SUPABASE_URL` 
   - `SUPABASE_SERVICE_KEY`

3. Run the script:
```bash
python scripts/braveheart_catalog.py
```

## Deployment

The project is configured for Vercel deployment. Simply connect your Git repository to Vercel and it will deploy automatically.

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint