# devora_

**A developer collaboration platform — code, compete, and build, all in one place.**

Devora combines DSA practice, private live coding battles, and (in future phases) project collaboration into a single platform for developers — built from scratch, self-hosted, and free to run end to end.

---

## Why Devora

Most developers juggle separate tools for separate needs: LeetCode for practice, Codeforces/HackerRank for contests, GitHub for code, Slack/Discord for teams. Devora's core idea is **private, on-demand coding battles** — instead of waiting for a scheduled public contest with thousands of strangers, you spin up a room, share a 6-character code with friends or teammates, and compete in real time, with the platform automatically calculating a fair minimum time limit based on the questions selected.

Everything underneath — auth, grading, real-time sync, and code execution — was built from scratch rather than wired together from third-party APIs, specifically to demonstrate full-stack systems design: authentication, a custom sandboxed code execution engine, WebSocket-based real-time architecture, and a server-authoritative competitive scoring system.

---

## What's built (MVP)

### 🔐 Authentication
- Email/password signup and login with hashed passwords (bcrypt) and `httpOnly` JWT cookies (XSS-resistant by design)
- GitHub OAuth login, with automatic account linking by email
- Anti-enumeration login errors (never reveals whether an email exists in the system)

### 🧩 DSA Practice
- Curated problems across difficulty levels and topics (Arrays, Strings, Hash Table, DP, Sorting, Greedy, DFS, and more)
- A real code editor (Monaco — the engine behind VS Code) with syntax highlighting for C++ and Java
- Actual grading against hidden test cases, with verdicts: Accepted, Wrong Answer, Time Limit Exceeded, Compile Error, Runtime Error
- A "Run" mode to test against sample cases only, without submitting for a graded verdict
- Per-user solved-problem tracking

### ⚔️ Private Coding Battles
- Host-created rooms with a shareable room code (up to 10 participants)
- Configurable battles: topic-based, fully random, or mixed difficulty; 1–10 questions
- **Smart duration enforcement** — the platform calculates the minimum fair battle length from the selected questions' difficulty, and the host cannot set a shorter timer
- Live, real-time leaderboard via WebSockets — rankings, scores, and penalties update instantly for every participant as submissions come in
- A genuine competitive scoring formula: base points by difficulty, a time-decay bonus for faster solves, and point penalties for wrong attempts (with a floor so no one goes negative)
- A **server-authoritative timer** — the battle's start time and duration live on the server; no client can manipulate their local clock to gain time, and the battle only ends when the server says it's over
- Automatic battle completion when the timer expires, the host ends it early, or every participant finishes
- A final results screen with per-question breakdowns and podium-style rankings

### 🐳 A from-scratch, sandboxed code execution engine
Rather than integrating a third-party judge API, Devora's execution engine is a standalone microservice that compiles and runs untrusted user code inside **fully ephemeral, single-use Docker containers** — built specifically to demonstrate secure sandboxing:

- Every submission gets its own throwaway container, destroyed immediately after (`--rm`, plus a secondary `docker rm -f` safety net)
- `--network=none` — zero network access from inside the sandbox
- Hard memory, CPU, and process-count limits per container (blocks fork bombs and runaway memory use)
- Runs as a non-root user inside the container, never root
- A Node-side timer independently kills any container that exceeds its time limit, so an infinite loop can never hang the system — this produces a clean `Time Limit Exceeded` verdict instead of a stuck process
- Read-only root filesystem, with only a per-submission scratch directory mounted as writable
- Distinguishes the platform's own infrastructure failures (`System Error`) from the user's code being wrong — a Docker hiccup is never mistakenly counted against the user

Currently supports **C++** and **Java**, chosen deliberately as the two most common languages for DSA interviews and both requiring a real compile step (a more meaningful test of the sandbox than an interpreted-only language).

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite) · Tailwind CSS v4 · Redux Toolkit · React Router · Axios · Socket.IO Client · Monaco Editor |
| Backend | Node.js · Express · Socket.IO · JWT · Passport (GitHub OAuth) · Mongoose |
| Database | MongoDB (self-hosted via Docker, no cloud dependency) |
| Code Execution | Custom Node/Express microservice orchestrating Docker containers directly (no third-party judge API) |
| Auth | JWT in `httpOnly` cookies · bcrypt password hashing · GitHub OAuth 2.0 |

**Everything in this stack runs locally, for free, with no paid API keys.** The only external dependency is a free GitHub OAuth App registration.

---

## Architecture

Devora is a monorepo with three independent services, each with a clear single responsibility:

```
Devora/
├── client/              React + Redux frontend (Vite dev server)
├── server/               Express API + Socket.IO (auth, problems, battles)
├── execution-engine/     Standalone Docker-orchestration microservice
├── docker/               Dockerfiles for the C++ and Java sandbox runner images
└── docker-compose.yml     Local MongoDB
```

**Why a separate execution engine?** The main `server` never touches Docker directly — it makes a simple HTTP call to the execution engine and gets back a verdict. This mirrors how real competitive-programming platforms separate orchestration from execution, keeps the sandboxing logic isolated and auditable, and means the riskiest, most security-sensitive code lives in one small, well-tested service rather than being spread through the main API.

**REST vs. WebSockets:** Battle creation, joining, and fetching state use REST (standard CRUD, no need for a persistent connection). Everything that needs to happen live — the lobby's participant list, the battle timer, submission grading, and the leaderboard — happens over Socket.IO, scoped to a room per battle via its room code.

---

## Getting started

### Prerequisites
- Node.js (v18+) and npm
- Docker Desktop (or Docker Engine on Linux) — running
- Git

### 1. Clone and install
```bash
git clone https://github.com/IshankAggarwal09/devora.git
cd devora
npm install
```
This installs dependencies across all three workspaces (`client`, `server`, `execution-engine`) via npm workspaces.

### 2. Start MongoDB
```bash
docker compose up -d
```

### 3. Configure environment variables
Copy the example env files and fill them in:
```bash
cp server/.env.example server/.env
cp execution-engine/.env.example execution-engine/.env
cp client/.env.example client/.env
```

`server/.env` needs a GitHub OAuth App's client ID and secret — create one for free at **GitHub → Settings → Developer settings → OAuth Apps**, with:
- Homepage URL: `http://localhost:5173`
- Callback URL: `http://localhost:5000/api/auth/github/callback`

### 4. Build the sandbox runner images
```bash
docker build -t devora-executor-cpp ./docker/cpp
docker build -t devora-executor-java ./docker/java
```

### 5. Run everything
```bash
npm run dev
```
This starts the client (`localhost:5173`), server (`localhost:5000`), and execution engine (`localhost:5001`) concurrently.

### 6. Seed a problem or two
Flip your user's `isAdmin` field to `true` directly in MongoDB, then use the admin problem-creation route to add a few problems before trying out the practice or battle flows.

---

## Security notes

A few design decisions worth calling out, since they were deliberate rather than defaults:

- **Hidden test cases never leave the server.** Every API response — including the ones broadcast over WebSockets when a battle starts — strips grading test cases down to only the ones explicitly marked as public samples.
- **Every code submission runs in an isolated, resource-capped, network-disabled, non-root container that's destroyed immediately after use.** Nothing about the execution engine trusts the submitted code.
- **The battle timer is server-authoritative.** Clients only ever *display* time computed by the server; they cannot influence when a battle actually ends.
- **Login errors are anti-enumeration** — the API gives identical responses whether an email doesn't exist or the password was wrong, so the login endpoint can't be used to discover which emails are registered.

---

## Roadmap

The current MVP covers the platform's core loop (practice → compete → improve). The original vision for Devora is broader, and these are the planned next phases:

- **Developer Collaboration Workspace** — project creation, team invites, deliverable tracking
- **Task & Sprint Management** — Kanban boards, sprint planning, deadline tracking
- **Team Communication** — real-time chat, project channels, code snippet sharing
- **GitHub Integration** — repository display, contribution graphs, PR monitoring
- **AI Code Review** — automated complexity analysis and optimization suggestions
- **Developer Profiles & Reputation** — skills showcase, achievements, battle stats as a practical alternative to a traditional resume
- **Learning Roadmaps** — structured DSA/frontend/backend/interview-prep learning paths
- Additional language support in the execution engine beyond C++ and Java

---

## Project background

Devora was built as an end-to-end systems project, with a deliberate emphasis on building the hard parts — authentication, a secure code sandbox, and real-time competitive infrastructure — from first principles rather than assembling third-party services. Every phase was designed, built, and verified against a real test checklist (including deliberately trying to break things: infinite loops, concurrent submissions, tampered cookies, non-admin access attempts) before moving to the next.

---

## License

MIT
