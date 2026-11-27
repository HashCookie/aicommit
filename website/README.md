This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

This app lives in `website/` inside the aicommit repository. Production deploys from `master`; pull requests get a preview URL.

### Git integration

1. Import `HashCookie/aicommit` at [vercel.com/new](https://vercel.com/new).
2. Set **Root Directory** to `website`.
3. Leave Framework Preset as Next.js. Install and build commands come from `vercel.json`.
4. Optional: set `NEXT_PUBLIC_APP_URL` to the production URL (used for metadata). It defaults to the GitHub Pages address.

Pushes to `master` that touch `website/` deploy automatically. Do not also add the GitHub Actions secrets below, or the site will deploy twice.

### GitHub Actions

`.github/workflows/vercel.yml` deploys with the Vercel CLI when these repository secrets exist:

| Secret | Where to get it |
| --- | --- |
| `VERCEL_TOKEN` | [Account tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | `website/.vercel/project.json` after `vercel link` |
| `VERCEL_PROJECT_ID` | same file |

```sh
cd website
vercel link
```

If the secrets are missing, the workflow skips. GitHub Pages (`.github/workflows/pages.yml`) is unchanged and still publishes the static export to `/aicommit`.
