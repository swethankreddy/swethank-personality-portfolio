This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

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

## AI System Evaluation

The chat assistant uses a **deterministic retrieval layer over a structured index**,
not a vector database. The model does not search — it calls `searchPortfolio`, which
runs an IDF-weighted lexical ranker, then fetches detail for every candidate returned.
Full methodology and the ranking formula: [`docs/AI_EVALUATION.md`](docs/AI_EVALUATION.md).

Live 50-question benchmark through the real chat route, `gemini-2.5-flash`:

| Metric | Before | After |
|---|---|---|
| Retrieval Recall@5 | 80.4% | **94.4%** |
| Entity accuracy | 75.0% | **87.5%** |
| Keyword coverage | 81.4% | **90.7%** |
| Avg entities retrieved | 1.00 | **1.52** |
| Off-topic refusal | 71.4% | **100%** |
| Answers with unsupported numbers | 0/50 | **0/50** |
| Avg latency | 4,615 ms | 5,854 ms |
| Context reduction | 61.4% | 57.9% |

Recall improved because retrieval moved out of the LLM. Latency and token count got
worse, because the pipeline now makes an extra tool call and fetches more evidence
per question. Both directions are measured, not estimated.

```bash
npm run dev
node evaluation/run-eval.mjs          # retrieval only, no LLM calls
node evaluation/run-eval.mjs --live   # full pipeline, real app
curl 'localhost:3000/api/search?q=computer+vision'
```

Per-request telemetry (query, retrieval path, tools called, latency, context size)
is appended to `.observability/events.jsonl` and rendered at `/admin/observability`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
