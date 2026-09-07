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

Dependencies target stable compatible releases. Prisma stays on stable 7.x while its `latest` tag points to an 8.x release candidate; NextAuth stays on the project's existing v5 beta track. ESLint stays on 9.39.5 because Next.js's bundled React, import, and accessibility lint plugins do not support ESLint 10 yet. The tables use TanStack Table 9's compatibility API to preserve their existing filtering, sorting, and pagination behavior.

The Prisma client keeps the supported `prisma-client-js` generator for this JavaScript project and its CommonJS maintenance scripts. All client instances now use the PostgreSQL adapter. Production builds require the configured Resend and EdgeStore environment variables even when no external services are called during the build.

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

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
