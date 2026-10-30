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
