# Werewolf Game

A real-time multiplayer social deduction game. Play locally against AI bots or online with friends via shareable room codes.

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Framer Motion, Zustand
- **Backend:** Node.js, Express, Socket.IO
- **Build:** TypeScript + Vite (frontend), `tsx` (backend)

## Local Development

You need two terminals — one for the backend, one for the frontend.

```bash
# Install dependencies
npm install

# Terminal 1 — Backend server (port 3001)
npm run server

# Terminal 2 — Vite dev server (port 3000, proxies /socket.io to backend)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Production Build

```bash
npm run build   # Builds frontend to dist/
npm run start   # Starts the backend server (serves dist/ and handles WebSockets)
```

The server listens on `$PORT` (default 3000).

## How to Play

1. Click **Play Online**
2. **Create Room** — copy the 4-letter code and send it to friends
3. Friends click **Join Room** and enter the code
4. When 4–12 players have joined, the **host clicks Start Game**
5. Everyone receives a secret role:
   - **Villager** — find and vote out the Werewolves
   - **Werewolf** — eliminate villagers at night, deceive them by day
   - **Seer** — investigate one player each night to learn if they're a Werewolf

### Game Flow
- **Night** — Werewolves choose a victim, the Seer investigates
- **Dawn** — Everyone sees who died and their revealed role
- **Day** — Discuss and chat, then the host starts voting
- **Voting** — Everyone votes to eliminate one person
- **Execution** — Results revealed, eliminated player's role shown
- Repeat until the Village or Werewolves win

## Deployment

### Render (Recommended)

1. Push this repo to GitHub
2. On Render, create a **New Web Service** → connect your repo
3. Settings:
   - **Root Directory:** `app`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npx tsx server/index.ts`
4. Click **Create Web Service**

Render auto-assigns a URL like `https://werewolf-xyz.onrender.com`.

### Fly.io

```bash
cd app
fly launch
# Edit fly.toml to set:
#   [build]
#     dockerfile = "Dockerfile"
# Or use:
fly deploy --build-arg NODE_ENV=production
```

### Environment Variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | Server port | `3000` |
| `VITE_SERVER_URL` | Socket.IO server URL (dev only) | `window.location.origin` |

## Project Structure

```
app/
├── server/            # Express + Socket.IO backend
│   ├── index.ts       # Server entry
│   └── gameRoom.ts    # Room logic & game engine
├── src/
│   ├── screens/       # Game screens (Home, Lobby, Night, Day, etc.)
│   ├── store/         # Zustand game state
│   ├── engine/        # Game logic (roles, voting, win conditions)
│   ├── types/         # TypeScript definitions
│   ├── socket.ts      # Socket.IO client
│   └── components/ui/ # shadcn/ui components
├── public/            # Static assets (card images, backgrounds)
├── dist/              # Built frontend (generated)
└── package.json
```

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Vite dev server (frontend only, proxies WebSocket) |
| `npm run server` | Backend dev server on port 3001 |
| `npm run build` | Type-check and build frontend to `dist/` |
| `npm run start` | Build + start production server |
| `npm run lint` | Run ESLint |
