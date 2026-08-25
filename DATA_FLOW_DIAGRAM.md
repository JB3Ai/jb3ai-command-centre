# jb3ai-command-centre Data Flow Diagram

## Overview
The jb3ai-command-centre is a React-based dashboard application that aggregates and displays data from multiple sources in a unified interface. The application uses Supabase as its primary data store and integrates with various external services through API connections.

## Architecture Components

### 1. Frontend Layer
- **React Application**: Built with TypeScript and Vite
- **UI Components**: Using Radix UI primitives and custom components
- **Routing**: React Router for navigation between 14 distinct panels
- **State Management**: React hooks (useState, useEffect, useCallback)

### 2. Data Sources

#### Primary Data Source: Supabase Database
The application connects to a Supabase PostgreSQL database that stores all application data through multiple tables:

##### Core Tables:
- `hub_calendar` - Calendar events from Google Calendar integration  
- `hub_emails` - Email data from Gmail integration
- `hub_deploys` - Deployment status from Vercel integration
- `hub_sync_status` - Integration status monitoring
- `hub_braveheart` - Creditors and legal matters data (extended from initial schema)
- `hub_rss_feeds` - RSS feed aggregation data
- `hub_social_media` - Social media responses and interactions

##### New Tables Added in Migration:
- `hub_daily_intentions` - Productivity tracking
- `hub_daily_reviews` - Daily reflections
- `hub_reading_queue` - Reading list management
- `hub_links` - Bookmark collection
- `hub_notes_dump` - Notes and quick captures
- `hub_quick_capture` - Quick task capture
- `hub_marketing_leads` - CRM data
- `hub_news_items` - News aggregation
- `hub_media_items` - Media asset management
- `hub_monthly_chronicles` - Monthly summaries
- `hub_bankzero_transactions` - Financial transaction data

#### External Data Sources:
- **Google Calendar**: Calendar event integration
- **Gmail**: Email integration
- **Vercel**: Deployment status monitoring
- **RSS Feeds**: News aggregation (open source and free)
- **BankZero**: Financial data import (manual upload)
- **Social Media Platforms**: LinkedIn, YouTube, Instagram, Facebook, Meta Business, WhatsApp
- **Cloud Storage**: Google Drive, OneDrive, iCloud (Apple, Google, Microsoft integrations)

### 3. Data Flow Architecture

#### Data Retrieval Process:
1. **Authentication**: Supabase authentication via magic-link (PKCE)
2. **Real-time Subscriptions**: WebSocket connections to Supabase for live updates
3. **Polling Fallback**: 5-minute polling for data freshness
4. **Data Aggregation**: Multiple concurrent queries to different tables
5. **Data Presentation**: Component-level data binding and rendering

#### Key Data Flows:

##### Main Dashboard Panel (Home):
- Retrieves data from: `hub_calendar`, `hub_emails`, `hub_deploys`, `hub_sync_status`, `hub_rss_feeds`, `hub_social_media`
- Uses Supabase client to query tables with filters and sorting
- Implements real-time updates via Supabase channel subscriptions
- Displays data in organized panels with status indicators

##### BRAVEHEART Panel:
- Primary data source: `hub_braveheart` (creditors and legal matters)
- Extends existing schema with additional fields for legal tracking
- Shows creditor information, matter status, court dates, and financial exposure

##### BankZero Panel:
- Data source: `hub_bankzero_transactions` (financial transactions)
- Manual CSV import functionality
- Displays transaction history with categorization

##### Marketing Panel:
- Data source: `hub_marketing_leads` (CRM data)
- Manages leads with stages, sources, and contact information
- Tracks marketing campaign effectiveness
- Social media responses from LinkedIn, YouTube, Instagram, Facebook, Meta Business, WhatsApp

##### News Panel:
- Data source: `hub_news_items` (aggregated news)
- Combines RSS feeds and Gmail AI news labels
- Displays news items with read/unread status

##### Media Panel:
- Data source: `hub_media_items` (media assets)
- Kanban-style board for creative assets
- Supports different media types (images, videos, audio)

##### Cloud Storage Panel:
- Data source: `hub_cloud_storage` (Google Drive, OneDrive, iCloud)
- Monitors file changes, access patterns, and storage usage
- Integrates with Apple, Google, and Microsoft ecosystems

##### Other Panels:
- Links: `hub_links` table for bookmark management
- Notes: `hub_notes_dump` for quick captures
- Projects: Integration with GitHub, cPanel, VSCode
- Chronicle: `hub_monthly_chronicles` for monthly summaries
- Config: Integration status monitoring via `hub_sync_status`

### 4. Data Relationships

#### Primary Relationships:
- **hub_braveheart** ↔ **hub_emails**: Related by Gmail thread IDs for correspondence tracking
- **hub_deploys** ↔ **hub_projects**: Deployment status for project tracking
- **hub_calendar** ↔ **hub_braveheart**: Calendar events linked to legal matter deadlines
- **hub_braveheart** ↔ **hub_bankzero_transactions**: Financial data related to legal matters
- **hub_social_media** ↔ **hub_emails**: Social media responses linked to email communications
- **hub_cloud_storage** ↔ **hub_braveheart**: Documents stored in cloud services related to legal matters

#### Secondary Relationships:
- **hub_news_items** ↔ **hub_emails**: AI-generated news from email labels
- **hub_media_items** ↔ **hub_braveheart**: Media assets related to legal matters
- **hub_marketing_leads** ↔ **hub_emails**: Lead communication history
- **hub_rss_feeds** ↔ **hub_news_items**: RSS feed content aggregated into news items
- **hub_cloud_storage** ↔ **hub_media_items**: Cloud-stored media assets

### 5. Data Processing Flow

1. **Data Ingestion**:
   - External services push data to Supabase tables
   - Scheduled sync processes populate data from integrations
   - Manual imports (CSV for BankZero)

2. **Data Transformation**:
   - Supabase triggers handle timestamp updates
   - Row-level security ensures data privacy
   - Data normalization for consistent presentation

3. **Data Presentation**:
   - Frontend components query Supabase tables
   - Real-time subscriptions provide live updates
   - Filtering and sorting for user experience
   - Status indicators and visual cues

### 6. Security and Access Control

- **Authentication**: Supabase magic-link authentication with PKCE
- **Authorization**: Row-level security (RLS) policies on new tables
- **Session Management**: LocalStorage persistence with auto-refresh
- **Data Privacy**: All data access restricted to authenticated users

### 7. Real-time Features

- **WebSocket Subscriptions**: Live updates for all major data tables
- **Polling Fallback**: 5-minute polling for data freshness
- **Status Monitoring**: Integration status via `hub_sync_status`
- **Immediate Updates**: Component re-renders on data changes

### 8. Performance Considerations

- **Query Optimization**: Efficient filtering and limiting of results
- **Caching**: Client-side state management for reduced API calls
- **Batch Operations**: Concurrent queries for multiple data sources
- **Lazy Loading**: Panel-specific data loading

## Summary

The jb3ai-command-centre application demonstrates a modern data integration architecture where:
1. A centralized Supabase database serves as the single source of truth
2. Multiple external services feed data through various integration points
3. Real-time updates provide a responsive user experience
4. Well-defined data relationships enable rich data visualization
5. Security measures protect sensitive information
6. Modular design allows for independent development of different panels

This architecture enables users to manage complex workflows across multiple domains (legal, finance, communications, productivity) from a single unified interface.