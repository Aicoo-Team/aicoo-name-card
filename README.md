# Aicoo Agent Name Card

Agent-linked business cards built with Next.js, React, and Neon. The canonical
production host is `https://www.agentport.world`.

## Checks

Use Node.js 24 LTS (the test runner uses native TypeScript stripping).

```sh
npm ci --ignore-scripts
npm test
npm run typecheck
npm run lint
npm run build
```

The checks require no production credentials. Building currently downloads Google
fonts, so internet access is required. GitHub Actions runs the same checks on PRs.

## Contact export

The public card's **Save** action downloads a vCard 3.0 file. A bound Agent is
included as a labeled URL and in the contact note, alongside the existing website
and biography. An explicitly inactive Agent is not exported. Export does not
renew a link, grant access, or create a connection between users.

See [export behavior and device acceptance](docs/vcard-export.md). Contact-app
import and link-opening behavior still require testing on actual devices.

## Configuration and scope

Use `.env.example` as the list of configuration names and obtain development
values securely from the maintainer. Never commit credentials. Without a database
URL, the existing store uses local `.data/db.json`; this is not production storage.
Keep the registered OAuth redirect on the **www root URL**, not `/callback`.

This first reliability change does not fix the existing upload, slug-conflict,
OAuth refresh/scope, or share-expiry issues, and does not add reciprocal exchange.
See [the phased backlog](docs/roadmap.md) before treating this app as release-ready.

## Next.js development

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

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
