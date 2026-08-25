# Email Ingestion & Routing Setup Guide

This document provides a comprehensive guide for setting up email ingestion and routing for `subscriptions@jonoblackburn.com` to automatically process invoice emails.

## Overview

This setup enables automatic processing of invoice emails sent to `subscriptions@jonoblackburn.com` by:
1. Configuring email forwarding/routing in cPanel/Google Workspace
2. Implementing a Supabase Edge Function to parse invoice data
3. Matching invoices to existing subscriptions and updating billing information

## 1. cPanel / Google Workspace Alias Setup

### Google Workspace Setup

1. **Create the Email Alias**
   - Go to Google Admin Console
   - Navigate to Apps > Google Workspace > Gmail > Email routing
   - Create a new alias: `subscriptions@jonoblackburn.com`
   - Set the alias to forward to `jono@jonoblackburn.com`

2. **Configure Email Forwarding with Webhook**
   - In Google Workspace, go to Gmail settings
   - Enable "Forwarding and POP/IMAP"
   - Set up forwarding to your webhook endpoint
   - Enable "Forward a copy to" to also send to `jono@jonoblackburn.com`
   - Configure the webhook to receive email data via POST request

### cPanel Setup

1. **Create Email Forwarder**
   - Log into cPanel
   - Navigate to Email Accounts
   - Create new email address: `subscriptions@jonoblackburn.com`
   - Set up forwarder to: `jono@jonoblackburn.com`
   - Enable "Pipe to a program" with your webhook handler

2. **Configure Webhook Pipe**
   - In the forwarder settings, configure the pipe to send email data to your Supabase Edge Function
   - Set the pipe command to: `/usr/bin/curl -X POST https://your-supabase-project.supabase.co/functions/v1/parse-invoice-email`

## 2. Supabase Edge Function Implementation

### Function Location
`supabase/functions/parse-invoice-email.ts`

### Implementation

```typescript
// supabase/functions/parse-invoice-email.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

// Supabase configuration
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

serve(async (req: Request) => {
  try {
    // Parse the incoming webhook payload
    const payload = await req.json()
    
    // Extract email components
    const { 
      subject, 
      sender, 
      htmlBody, 
      textBody, 
      attachments 
    } = payload
    
    // Extract invoice information
    const invoiceData = extractInvoiceData(subject, htmlBody, textBody, attachments)
    
    if (!invoiceData) {
      return new Response(
        JSON.stringify({ error: 'Failed to parse invoice data' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    // Match invoice to existing subscription
    const matchedSubscription = await matchSubscription(invoiceData)
    
    if (matchedSubscription) {
      // Update subscription billing information
      const { error } = await supabase
        .from('hub_subscriptions')
        .update({
          next_billing_date: invoiceData.invoiceDate,
          last_invoice_amount: invoiceData.amount,
          last_invoice_date: invoiceData.invoiceDate,
          updated_at: new Date().toISOString()
        })
        .eq('id', matchedSubscription.id)
      
      if (error) {
        throw new Error(`Database update error: ${error.message}`)
      }
      
      // Log successful match
      console.log(`Successfully processed invoice for subscription: ${matchedSubscription.service_name}`)
    } else {
      // Log unmatched invoice
      console.log(`Unmatched invoice received from: ${sender}`)
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Invoice processed successfully',
        matched: !!matchedSubscription,
        subscriptionId: matchedSubscription?.id
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error processing invoice:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

// Helper function to extract invoice data from email
function extractInvoiceData(
  subject: string, 
  htmlBody: string, 
  textBody: string, 
  attachments: any[]
): InvoiceData | null {
  // Extract vendor name from subject
  const vendorMatch = subject.match(/(?:from|by)\s+(.+?)(?:\s+(?:invoice|bill|receipt))/i)
  const vendorName = vendorMatch ? vendorMatch[1].trim() : 'Unknown Vendor'
  
  // Extract invoice date (look for common date patterns)
  const dateRegex = /\b(?:\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{2,4}[\/\-]\d{1,2}[\/\-]\d{1,2})\b/
  const dateMatch = htmlBody.match(dateRegex) || textBody.match(dateRegex)
  const invoiceDate = dateMatch ? new Date(dateMatch[0]) : new Date()
  
  // Extract amount (look for currency patterns)
  const amountRegex = /(?:R\$?|USD\$?|EUR\$?)\s*(\d+(?:\.\d{2})?)/
  const amountMatch = htmlBody.match(amountRegex) || textBody.match(amountRegex)
  const amount = amountMatch ? parseFloat(amountMatch[1]) : 0
  
  // Extract currency
  const currency = amountMatch && amountMatch[0].includes('USD') ? 'USD' : 
                  amountMatch && amountMatch[0].includes('EUR') ? 'EUR' : 'ZAR'
  
  // Check for PDF attachments
  const hasPDF = attachments.some(att => att.filename?.toLowerCase().endsWith('.pdf'))
  
  return {
    vendorName,
    invoiceDate,
    amount,
    currency,
    hasPDF,
    subject,
    sender
  }
}

// Helper function to match invoice to existing subscription
async function matchSubscription(invoiceData: InvoiceData): Promise<any | null> {
  // Search for subscriptions that match the vendor name
  const { data, error } = await supabase
    .from('hub_subscriptions')
    .select('*')
    .ilike('service_name', `%${invoiceData.vendorName}%`)
    .eq('status', 'active')
  
  if (error) {
    console.error('Database query error:', error)
    return null
  }
  
  // Return first match or null if none found
  return data.length > 0 ? data[0] : null
}

// Invoice data interface
interface InvoiceData {
  vendorName: string;
  invoiceDate: Date;
  amount: number;
  currency: string;
  hasPDF: boolean;
  subject: string;
  sender: string;
}
```

### Function Configuration

1. **Environment Variables** (in Supabase Functions settings):
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key

2. **Function Settings**:
   - Runtime: Deno
   - Memory: 512 MB
   - Timeout: 30 seconds
   - Trigger: HTTP endpoint

## 3. Email Parsing Logic

### Invoice Data Extraction

The edge function extracts the following information from incoming emails:

1. **Vendor Name**: Extracted from email subject (e.g., "Invoice from Netflix")
2. **Invoice Date**: Detected from email body using date patterns
3. **Amount**: Extracted from email body using currency patterns
4. **Currency**: Determined from amount format
5. **Attachments**: Checks for PDF invoice attachments

### Matching Algorithm

The function attempts to match invoices to existing subscriptions by:
1. Searching for subscriptions with names containing the vendor name
2. Filtering for active subscriptions only
3. Returning the first match found

## 4. Security Considerations

### Authentication
- The function should only accept requests from verified email providers
- Implement IP whitelisting for email service providers
- Add HMAC signature verification for webhook requests

### Data Protection
- All email data is processed securely
- No sensitive information is stored in logs
- Use HTTPS for all communications

## 5. Testing and Validation

### Local Testing
```bash
# Test the function locally with curl
curl -X POST https://your-supabase-project.supabase.co/functions/v1/parse-invoice-email \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Invoice from Netflix",
    "sender": "noreply@netflix.com",
    "htmlBody": "<p>Invoice for Netflix Premium</p><p>Date: 2026-08-20</p><p>Amount: R149.99</p>",
    "textBody": "Invoice from Netflix\nDate: 2026-08-20\nAmount: R149.99",
    "attachments": []
  }'
```

### Monitoring
- Monitor function execution logs in Supabase
- Set up alerts for failed processing attempts
- Track successful matches and unmatched invoices

## 6. Troubleshooting

### Common Issues

1. **Webhook Not Receiving Emails**
   - Verify email forwarding is properly configured
   - Check that the webhook URL is accessible
   - Confirm email provider supports webhook delivery

2. **Parsing Failures**
   - Adjust regex patterns for different invoice formats
   - Add more robust date/time parsing
   - Improve vendor name matching algorithms

3. **Database Errors**
   - Verify Supabase connection credentials
   - Check subscription table structure
   - Ensure proper indexing for matching queries

### Logging and Debugging

The function logs all processing activities:
- Successful invoice processing
- Unmatched invoices
- Database errors
- Parsing failures

## 7. Integration with Existing Dashboard

The parsed invoice data is automatically integrated with the existing subscriptions dashboard:
- Updates `next_billing_date` for matched subscriptions
- Records `last_invoice_amount` and `last_invoice_date`
- Maintains audit trail of all invoice processing

This setup provides a complete solution for automating subscription invoice processing through email ingestion, enabling seamless integration with the existing subscriptions dashboard.