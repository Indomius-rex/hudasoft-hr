# Peoplewise HRMS — UI source

Includes the responsive admin and employee interfaces, shared styles, local demo data, client-side calculations, and Supabase client integration.

## Run

Install Node.js 22+ and pnpm, then:

```sh
pnpm install
cp .env.example .env.local
pnpm dev
```

Open http://localhost:3000 and choose Admin demo or Employee demo. Sample changes remain in the browser. To create a production build, run `pnpm build`, then `pnpm start`.

This UI export excludes database migrations, tests, installed dependencies, build artifacts, and private environment files. Live Google login and data require an existing Supabase backend configured for the full HRMS schema and functions. Demo mode works without that backend.
