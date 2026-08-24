# Local Development Setup Guide

## Authentication Issues in Development

When developing locally, the Supabase magic link authentication can be problematic because:
1. The redirect URL in the magic link doesn't match your local development environment
2. The authentication flow expects specific redirect URLs configured in Supabase

## Solutions for Local Development

### Option 1: Allow All Emails (Quick Fix)
For local development, you can temporarily allow all emails by uncommenting this line in your `.env.local` file:

```bash
# Allow all emails for local development
VITE_AUTH_ALLOWED_EMAILS=*
```

### Option 2: Configure Supabase Redirect URLs
1. Go to your Supabase project dashboard
2. Navigate to Auth → URL Configuration
3. Add the following redirect URL:
   ```
   http://localhost:5173/auth/callback
   ```

### Option 3: Use a Development Environment Variable
In your `.env.local` file, you can also set:
```bash
VITE_SUPABASE_REDIRECT_URL=http://localhost:5173/auth/callback
```

## Recommended Local Development Setup

1. Create a `.env.local` file based on `.env.example`:
   ```bash
   cp .env.example .env.local
   ```

2. Update `.env.local` with:
   ```bash
   VITE_AUTH_ALLOWED_EMAILS=*
   VITE_SUPABASE_REDIRECT_URL=http://localhost:5173/auth/callback
   ```

3. Make sure your Supabase project has the correct redirect URL configured in:
   - Auth → URL Configuration → Redirect URLs
   - Add: `http://localhost:5173/auth/callback`

## Alternative: Google Authentication (For Production)

Once you're ready to go live, you can integrate Google authentication:

1. Enable Google OAuth in Supabase:
   - Auth → Providers → Google → Enable
   - Configure the OAuth credentials

2. Update your Supabase configuration to use Google as the primary authentication method

## Testing Authentication Locally

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Visit `http://localhost:5173/login`

3. Enter your email (or use the wildcard `*` to allow all emails)

4. Check your email for the magic link

5. Click the magic link to authenticate

## Troubleshooting

If you're still having issues with authentication:

1. Check that your `.env.local` file is properly configured
2. Verify that the redirect URL in Supabase matches your local development URL
3. Make sure you're using the correct Supabase project URL and keys
4. Clear your browser cache and cookies if needed
5. Check the browser console for any authentication-related errors

## Security Note

Remember to:
- Never commit `.env.local` to version control
- Use `VITE_AUTH_ALLOWED_EMAILS=*` only for local development
- Switch back to specific email addresses for production