# Werewolf

A multiplayer social deduction game built with React, Vite, and Socket.IO.

Play locally against AI or online with friends. Each player gets a secret role — Villager, Werewolf, or Seer. The villagers must identify and eliminate the werewolves before it's too late.

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

The easiest platforms for this Socket.IO app:

- **[Render](https://render.com)** — free tier, easiest setup
- **[Fly.io](https://fly.io)** — better latency, no cold starts
- **VPS** (Hetzner, DigitalOcean) — cheapest always-on option

See [`app/README.md`](app/README.md) for full deployment instructions.

## Docs

Game design documents, research, and architecture diagrams are in the [`docs/`](docs/) folder.
