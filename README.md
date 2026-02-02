# MyFO

Next.js 14 (App Router) + TypeScript frontend with Tailwind CSS.

## Requirements

- Node.js 18+ (or [Bun](https://bun.sh))

## Setup

```bash
npm install
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| (none required for basic run) | Add `OPENAI_API_KEY`, `DATABASE_URL` when building MyFO features |

Copy `.env.example` to `.env` and adjust as needed.

## Run

```bash
# Development
npm run dev

# Build
npm run build

# Start production server
npm start
```

## Usage

1. Run `npm run dev`
2. Open http://localhost:3000

The app includes:
- **Landing page** (/) with hero section
- **About**, **Contact**, **Product** pages
- **Navbar** and **Footer** on all pages
- **Tailwind CSS** for styling
- **Next.js App Router** for file-based routing
