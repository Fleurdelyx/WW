# Werewolf

A multiplayer social deduction game built with React, Vite, and Socket.IO.

Play locally against AI or online with friends. Each player gets a secret role — Villager, Werewolf, or Seer. The villagers must identify and eliminate the werewolves before it's too late.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

> **Note:** Clicking the button above deploys from this repo. If you fork it first, change the button link to your fork URL: `https://render.com/deploy?repo=https://github.com/YOUR_USERNAME/YOUR_REPO`

## Project Structure

```
.
├── app/          # Game source code (React frontend + Node.js backend)
└── docs/         # Design documents, research, and architecture diagrams
```

## Quick Start

```bash
cd app
npm install

# Development — run backend and frontend in separate terminals
npm run server    # backend on port 3001
npm run dev       # frontend on port 3000

# Production — build and start everything on one port
npm run start     # serves on $PORT (default 3000)
```

Open [http://localhost:3000](http://localhost:3000) and click **Play Online** to create a room and share the code with friends.

## Deployment

### One-Click Deploy (Render)

1. Fork this repo on GitHub
2. Update the deploy button above with your fork URL
3. Click **Deploy to Render**
4. Render auto-detects `render.yaml` and deploys both frontend and backend

### Manual Deploy (Render)

1. Push this repo to GitHub
2. On Render, create a **New Web Service** → connect your repo
3. Settings:
   - **Root Directory:** `app`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npx tsx server/index.ts`
4. Click **Create Web Service**

### Other Platforms

- **[Fly.io](https://fly.io)** — better latency, no cold starts
- **VPS** (Hetzner, DigitalOcean) — cheapest always-on option

See [`app/README.md`](app/README.md) for full deployment instructions.

## Docs

Game design documents, research, and architecture diagrams are in the [`docs/`](docs/) folder.
