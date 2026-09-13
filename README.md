This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

Use Node.js 22.13 or newer on the 22.x line, or Node.js 24+. Install the locked dependencies:

```bash
npm ci
```

Configure your application environment in `.env`, including `DATABASE_URL` (a PostgreSQL connection URL), authentication, EdgeStore, and Resend credentials. Installation generates the Prisma client without connecting to the database.

Then run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Run `npm run lint` and `npm run build` to check changes. Prisma 7 uses `prisma.config.mjs` for the database URL and migration settings, and the PostgreSQL driver adapter for runtime connections. After changing the schema, run `npx prisma generate` explicitly. Database migrations and seed scripts must be run deliberately against the intended database.

Run `npm run test:discovery` to check category filtering, search, and pagination with an isolated database adapter. Public discovery groups legacy Environment projects under Agriculture, including old `category=environment` links.

Dependencies target stable compatible releases. Prisma stays on stable 7.x while its `latest` tag points to an 8.x release candidate; NextAuth stays on the project's existing v5 beta track. ESLint stays on 9.39.5 because Next.js's bundled React, import, and accessibility lint plugins do not support ESLint 10 yet. The tables use TanStack Table 9's compatibility API to preserve their existing filtering, sorting, and pagination behavior.

The Prisma client keeps the supported `prisma-client-js` generator for this JavaScript project and its CommonJS maintenance scripts. All client instances now use the PostgreSQL adapter. Production builds require the configured Resend and EdgeStore environment variables even when no external services are called during the build.

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Google sign-in

The production app runs on a VPS at `https://impactofresearch.fund`. In [Google Cloud Console](https://console.cloud.google.com/auth/clients), select the Web application OAuth client matching the configured client ID and use these settings:

| Setting | Production value |
| --- | --- |
| Authorized JavaScript origins | `https://impactofresearch.fund` |
| Authorized redirect URIs | `https://impactofresearch.fund/api/auth/callback/google` |

If Google Auth Platform Branding asks for an authorized domain, use `impactofresearch.fund` without a scheme or path. Local development can use a separate client with the redirect URI `http://localhost:3000/api/auth/callback/google`.

Google requires an exact match, including scheme, hostname, port, and path. A `redirect_uri_mismatch` error must be fixed in the OAuth client's redirect settings; changing the login button cannot fix it. See [Google's redirect URI requirements](https://developers.google.com/identity/protocols/oauth2/web-server#authorization-errors-redirect-uri-mismatch).

When replacing the Google Cloud project or OAuth client, update the credentials in the **VPS application's environment**. The existing variable names work with both the original auth configuration and the updated code:

```dotenv
GOOGLE_CLIENT_ID="YOUR_NEW_CLIENT_ID"
GOOGLE_CLIENT_SECRET="YOUR_NEW_CLIENT_SECRET"
AUTH_URL="https://impactofresearch.fund"
NEXTAUTH_URL="https://impactofresearch.fund"
NEXT_PUBLIC_APP_URL="https://impactofresearch.fund"
```

The updated code also supports `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`, which take precedence over `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. If those variables are already set, replace them with the new credentials too, or remove them to use the values above. Keep the existing `AUTH_SECRET` or `NEXTAUTH_SECRET`; changing Google credentials does not require replacing the app's session secret. Rebuild if public environment values changed and restart the production process using its configured process manager so the new environment is loaded. Editing the local development `.env` does not change the VPS environment.

Google accounts using an email already registered with a password must sign in with that password; automatic account linking is disabled. A failed attempt keeps the Google button available so a different Google account can be selected.

## Password recovery

The VPS needs `RESEND_API_KEY` and a verified sending domain in Resend. The default sender is `IMPACT R&D <support@impactofresearch.fund>`; set `APP_EMAIL_SENDER` to override it with another verified sender. Google OAuth credentials do not configure email delivery. See [Resend's Next.js setup](https://resend.com/docs/send-with-nextjs).

Reset links use `AUTH_URL`, then `NEXTAUTH_URL`, then `NEXT_PUBLIC_APP_URL`. Configure the production origin as `https://impactofresearch.fund`; missing URLs and localhost or non-HTTPS origins in production are rejected. Links expire after one hour and are usable once. A replacement link may be requested after one minute, up to three requests per account per day and ten per IP per hour. Use the most recent email. Failed sends report an error and release their token so another attempt can be made.

Run `npm run test:password-reset` for isolated regression tests. These tests mock email and database operations and do not send messages or change existing accounts. Deploy the code and restart the VPS application to apply changes; local edits do not update production.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## PayMongo payment methods (optional)

You can configure the PayMongo Checkout payment methods via an env variable. If not set, the API will use a comprehensive default list and PayMongo will only enable methods available to your account.

Example in `.env`:

```
PAYMONGO_PAYMENT_METHOD_TYPES=gcash,card,paymaya,grab_pay,shopeepay,billease,atome,qrph
```

Unknown values are ignored..
