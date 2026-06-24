# PayMongo Webhook Integration

This document explains the new webhook-based payment verification system that replaces the client-side verification.

## Overview

Instead of polling PayMongo's API from the client to verify payments, we now use webhooks to receive payment notifications directly from PayMongo. This is more reliable and efficient.

## Setup Required

### 1. Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# Existing
PAYMONGO_SECRET_KEY=sk_test_...

# New - Required for webhook security
PAYMONGO_WEBHOOK_SECRET=your_webhook_secret_here

# Optional - Enable Solana memo logging of successful payments
# Provide a server wallet private key as a JSON array (from solana-keygen) or hex string
SOLANA_PRIVATE_KEY=[1,2,3,...,64_numbers]
# Network endpoint or alias (devnet | testnet | mainnet-beta | https URL)
SOLANA_RPC_URL=devnet
# Commitment level (processed | confirmed | finalized)
SOLANA_COMMITMENT=confirmed
```

### 2. Configure PayMongo Dashboard

Create the webhook directly in your PayMongo dashboard:
1. Go to PayMongo Dashboard → Developers → Webhooks
2. Create a new webhook
3. Set the URL to: `https://your-domain.com/api/paymongo/webhook`
4. Select events: `checkout_session.payment.paid` and `payment.paid`
5. Copy the webhook secret and add it to your environment variables as `PAYMONGO_WEBHOOK_SECRET`

## How It Works

### Payment Flow

1. User clicks "Back This Project"
2. Frontend calls `/api/paymongo/create-checkout-session` with project and user data
3. PayMongo creates checkout session with metadata (projectId, userId)
4. User completes payment on PayMongo
5. PayMongo sends webhook to `/api/paymongo/webhook`
6. Webhook handler verifies signature and creates pledge in database
7. User returns to project page and sees success message

### Key Changes

1. **Removed Client-Side Verification**: No more polling `/api/paymongo/verify`
2. **Webhook Processing**: Payment processing happens server-side via webhook
3. **Metadata Usage**: Project and user info passed in checkout session metadata
4. **Simplified Client**: Client only shows success message when returning from payment

### Security

- Webhook signature verification prevents unauthorized requests
- Duplicate payment prevention using unique PayMongo session IDs
- Atomic database operations ensure data consistency

### Files Modified

- `components/ProjectPage/ProjectPageClient.jsx` - Removed verification logic
- `components/ProjectPage/project-detail/project-detail.jsx` - Updated checkout call
- `app/api/paymongo/create-checkout-session/route.js` - Added metadata support
- `app/api/paymongo/webhook/route.js` - New webhook handler
- `app/api/paymongo/verify/route.js` - Deleted (no longer needed)

### Testing

To test webhooks locally, use a service like ngrok to expose your local server:

```bash
ngrok http 3000
```

Then use the ngrok URL when creating your webhook in the PayMongo dashboard.

#### Solana memo logging (optional)

If you set `SOLANA_PRIVATE_KEY`, the webhook will submit a Memo transaction on Solana after a successful payment with `{ amount, title, authors }`. Ensure the server wallet has enough SOL to pay fees (use `solana airdrop 1` on devnet).

- Generate a keypair: `solana-keygen new -o ~/.config/solana/server.json`
- Show the public address: `solana address -k ~/.config/solana/server.json`
- Put the private key contents (JSON array) from that file into `SOLANA_PRIVATE_KEY`.
- To view the memo, copy the `solanaSignature` from the webhook response or server logs and check it on Solana Explorer for your network.

### Benefits

1. **More Reliable**: No dependency on client-side polling
2. **Real-time**: Immediate processing when payment completes
3. **Secure**: Server-side signature verification
4. **Efficient**: No unnecessary API calls from client
5. **Scalable**: Works better under high load
