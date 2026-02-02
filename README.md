# project-web

React + TypeScript frontend using Vite. Calls the project-api REST backend.

## Requirements

- [Bun](https://bun.sh) (v1.0+ recommended) or Node.js 18+

```bash
curl -fsSL https://bun.sh/install | bash
```

## Setup

```bash
bun install
```

## Environment Variables

| Variable           | Default               | Description              |
|--------------------|-----------------------|--------------------------|
| VITE_API_BASE_URL  | http://localhost:3001 | Backend API base URL     |

Copy `.env.example` to `.env` and adjust. Vite loads `.env` automatically.

## Run

```bash
# Development
bun run dev

# Build
bun run build

# Preview production build
bun run preview
```

## Usage

1. Start the backend (`project-api`) first: `cd project-api && bun run dev`
2. Start this frontend: `bun run dev`
3. Open http://localhost:5173

The home page shows:
- Health status from `GET /health`
- Example items from `GET /api/v1/example`
- A form to create items via `POST /api/v1/example`

## Troubleshooting

- **API connection refused**: Ensure `project-api` is running on port 3001
- **CORS errors**: Backend must have `CORS_ORIGIN=http://localhost:5173` (default)
- **Wrong API URL**: Set `VITE_API_BASE_URL` in `.env` to match your backend
