# DeepSearch

DeepSearch is a Next.js application that uses Supabase Postgres for persistent
data and Upstash Redis for caching.

## Requirements

- Node.js 20 or later
- pnpm 9 or later
- A Supabase project
- An Upstash Redis database

## Setup

1. Install dependencies with `pnpm`

```bash
pnpm install
```

2. Create a Supabase project and copy the Postgres connection string into `DATABASE_URL`.

Use a URL that includes SSL, for example with `?sslmode=require`.

3. Create an Upstash Redis database and set:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

4. Add the remaining required app secrets in `.env`:

- `AUTH_SECRET`
- `AUTH_DISCORD_ID`
- `AUTH_DISCORD_SECRET`
- `GOOGLE_GENERATIVE_AI_API_KEY`
- `SERPER_API_KEY`

5. Push the Drizzle schema:

```bash
pnpm db:push
```

6. Start the app:

```bash
pnpm dev
```

The development server runs at `http://localhost:3000`.

## Service checks

The configured integrations have been verified with the current environment:

- **Supabase/Postgres:** `SELECT 1` completed successfully.
- **Upstash Redis:** authenticated read/write returned `pong`.

To verify Upstash Redis locally:

```bash
node -r dotenv/config test-redis.js
```

To verify Supabase/Postgres locally:

```bash
node --input-type=module -e "import 'dotenv/config'; import postgres from 'postgres'; const sql = postgres(process.env.DATABASE_URL); console.log(await sql\`select 1 as ok\`); await sql.end();"
```

Keep `.env` out of version control and never publish its secret values.
