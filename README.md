# Givora web

Next.js 16 storefront for Givora. It talks to the API with credentialed cookies. Access and refresh tokens stay in HttpOnly cookies set by `api.givora.in`.

```bash
cp .env.example .env.local
npm ci
npm run dev
```

Set `NEXT_PUBLIC_API_URL` to the API origin. For local cookies across ports, leave `COOKIE_DOMAIN` empty on the API and use `http://localhost:3000` as `WEB_ORIGIN`.

Production deploys from GitHub Actions with the Vercel CLI. Automatic Vercel Git deploys are disabled in `vercel.json` so the workflow is the only publisher. Required secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.
