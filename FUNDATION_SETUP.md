# Foundation Setup for jb3ai-command-centre Redesign

## Overview
This document outlines the essential foundation setup for the redesigned jb3ai-command-centre application, ensuring all Supabase connectors and data inflows are properly configured and functioning.

## Supabase Configuration

### 1. Environment Variables Setup

Create a `.env.local` file with the following configuration:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-jwt-here
VITE_SUPABASE_SERVICE_KEY=your-service-role-key

# Authentication Configuration
VITE_AUTH_ALLOWED_EMAILS=*
VITE_SUPABASE_REDIRECT_URL=http://localhost:5173/auth/callback

# Development Settings
VITE_API_BASE_URL=http://localhost:5173/api
```

### 2. Supabase Table Structure Verification

The application relies on these core Supabase tables:

#### Core Tables:
1. **hub_tasks** - Task management from ClickUp
2. **hub_calendar** - Calendar events from Google Calendar  
3. **hub_emails** - Email data from Gmail
4. **hub_deploys** - Deployment status from Vercel
5. **hub_sync_status** - Integration status monitoring
6. **hub_braveheart** - Legal matters and creditors data

#### Additional Tables (from migrations):
- **hub_daily_intentions** - Daily productivity tracking
- **hub_daily_reviews** - Daily reflection data
- **hub_reading_queue** - Content reading queue
- **hub_links** - Bookmark collection
- **hub_notes_dump** - Notes and ideas
- **hub_marketing_leads** - CRM data
- **hub_news_items** - News aggregation
- **hub_media_items** - Creative assets
- **hub_bankzero_transactions** - Financial data
- **hub_whatsapp_messages** - Communication logs

### 3. Row Level Security (RLS) Configuration

Ensure RLS is properly configured for all tables:

```sql
-- Example RLS policy for hub_tasks
CREATE POLICY "Users can view their own tasks" 
ON public.hub_tasks 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tasks" 
ON public.hub_tasks 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);
```

## Data Inflow Connectors

### 1. Google Calendar Integration
- **Source**: Google Calendar API
- **Data Types**: Events, Attendees, Reminders
- **Frequency**: Real-time via webhooks or scheduled sync
- **Table**: `hub_calendar`

### 2. Gmail Integration
- **Source**: Gmail API
- **Data Types**: Emails, Threads, Attachments
- **Frequency**: Real-time via webhooks or scheduled sync
- **Table**: `hub_emails`

### 3. Vercel Integration
- **Source**: Vercel API
- **Data Types**: Deployments, Builds, Status
- **Frequency**: Real-time via webhooks or scheduled sync
- **Table**: `hub_deploys`

### 4. BankZero Integration
- **Source**: BankZero API or CSV Import
- **Data Types**: Transactions, Balances
- **Frequency**: Scheduled sync
- **Table**: `hub_bankzero_transactions`

### 5. Marketing CRM
- **Source**: CRM API or CSV Import
- **Data Types**: Leads, Campaigns, Contacts
- **Frequency**: Scheduled sync
- **Table**: `hub_marketing_leads`

### 6. RSS Feeds Integration
- **Source**: Open source RSS feed aggregators
- **Data Types**: News articles, blog posts, updates
- **Frequency**: Scheduled sync (every 15-30 minutes)
- **Table**: `hub_rss_feeds`

### 7. Social Media Integration
- **Source**: Platform APIs (LinkedIn, YouTube, Instagram, Facebook, Meta Business, WhatsApp)
- **Data Types**: Posts, comments, messages, engagement metrics
- **Frequency**: Real-time via webhooks or scheduled sync
- **Table**: `hub_social_media`

### 8. Cloud Storage Integration
- **Source**: Google Drive, OneDrive, iCloud APIs
- **Data Types**: Files, folders, access logs, storage usage
- **Frequency**: Scheduled sync (every 1-2 hours)
- **Table**: `hub_cloud_storage`

## Foundation Components

### 1. Supabase Client Configuration

```typescript
// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "fallback-url";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "fallback-key";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    flowType: "pkce",
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: "os3-command-centre-auth",
  },
});
```

### 2. Data Service Layer

Create a service layer to abstract data operations:

```typescript
// src/services/data-service.ts
import { supabase } from "@/lib/supabase";
import type { 
  HubCalendarEvent, 
  HubEmail,
  HubDeploy,
  HubBraveheartDocument
} from "@/lib/supabase";

export class DataService {
  // Calendar operations
  static async getCalendarEvents(filters?: any) {
    let query = supabase.from('hub_calendar').select('*');
    
    if (filters) {
      if (filters.startDate) query = query.gte('start_time', filters.startDate);
      if (filters.endDate) query = query.lte('end_time', filters.endDate);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  // Email operations
  static async getEmails(filters?: any) {
    let query = supabase.from('hub_emails').select('*');
    
    if (filters) {
      if (filters.sender) query = query.eq('sender', filters.sender);
      if (filters.dateRange) {
        query = query.gte('timestamp', filters.dateRange.start)
                .lte('timestamp', filters.dateRange.end);
      }
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }
}
```

### 3. Authentication Service

```typescript
// src/services/auth-service.ts
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export class AuthService {
  static async signInWithEmail(email: string) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    
    if (error) throw error;
  }

  static async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  static async getUser(): Promise<User | null> {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  }
}
```

## Testing Data Inflows

### 1. Connection Tests

Create a test file to verify all data connections:

```typescript
// src/tests/supabase-connection.test.ts
import { supabase } from "@/lib/supabase";

describe("Supabase Connection Tests", () => {
  test("Should connect to Supabase", async () => {
    const { data, error } = await supabase
      .from('hub_sync_status')
      .select('id, integration_name, status')
      .limit(1);
      
    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  test("Should have required tables", async () => {
    const tables = [
      'hub_tasks',
      'hub_calendar', 
      'hub_emails',
      'hub_deploys',
      'hub_braveheart',
      'hub_sync_status'
    ];
    
    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .select('id')
        .limit(1);
        
      // We don't necessarily expect success for all tables,
      // but we want to verify the connection works
      expect(error).toBeNull();
    }
  });
});
```

### 2. Data Validation Functions

```typescript
// src/utils/data-validation.ts
export function validateHubTask(task: any): boolean {
  return task &&
    typeof task.id === 'string' &&
    typeof task.title === 'string' &&
    task.status !== undefined;
}

export function validateHubCalendarEvent(event: any): boolean {
  return event &&
    typeof event.id === 'string' &&
    typeof event.title === 'string' &&
    event.start_time !== undefined;
}

export function validateHubEmail(email: any): boolean {
  return email &&
    typeof email.id === 'string' &&
    typeof email.subject === 'string' &&
    email.timestamp !== undefined;
}
```

## Foundation Checklist

### Supabase Configuration
- [ ] Supabase project URL configured
- [ ] Supabase anonymous key configured
- [ ] Supabase service role key configured (for server-side operations)
- [ ] RLS policies properly set up
- [ ] Required tables exist and are accessible

### Environment Variables
- [ ] `.env.local` file created with proper values
- [ ] Authentication allowed emails configured
- [ ] Redirect URLs properly configured
- [ ] API base URL configured

### Data Inflows
- [ ] All required Supabase tables are present
- [ ] Basic data operations work (select, insert, update)
- [ ] Authentication flow works
- [ ] Real-time subscription capabilities tested
- [ ] Error handling for data operations implemented

## Troubleshooting Guide

### Common Issues and Solutions

1. **Connection Errors**
   - Verify Supabase URL and keys in environment variables
   - Check network connectivity to Supabase
   - Ensure firewall allows connections to Supabase endpoints

2. **Authentication Failures**
   - Verify redirect URLs in Supabase Auth settings
   - Check that allowed emails are properly configured
   - Confirm environment variables are loaded correctly

3. **Data Access Issues**
   - Verify RLS policies are correctly configured
   - Check that user has proper permissions
   - Ensure tables exist and are accessible

4. **Real-time Updates Not Working**
   - Verify WebSocket connections are established
   - Check that proper channels are subscribed to
   - Confirm Supabase Realtime is enabled

## Next Steps

1. **Verify Supabase Connection**: Test basic database connectivity
2. **Test Authentication Flow**: Ensure magic link authentication works
3. **Validate Data Tables**: Confirm all required tables exist and are accessible
4. **Implement Data Services**: Create service layer for data operations
5. **Set Up Testing**: Create tests to verify data flows work correctly

This foundation setup ensures that all connectors and data inflows are properly configured and tested before moving to the UI redesign phase.