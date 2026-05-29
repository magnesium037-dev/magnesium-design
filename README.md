<div align="center">

# Magnesium Design

> *Inspired by claude-design and its derivatives, we have packaged it into a plug-and-play, beginner-friendly project. It allows you to generate visual products like PPTXs and videos using your favorite AI.*

[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/Node-18%2B-339933)](https://nodejs.org)

</div>

---

## What it does

Magnesium Design wraps AI content generation into a three-phase workflow with visual output.

| Mode | Output |
|------|--------|
| Content | 3 directions → context → outline → HTML + PNG + PPTX |
| Animation | Prompt → animated HTML → MP4 video |

**The HTML IS the visual design.** AI generates complete HTML pages with styling, then Playwright renders them into screenshots and video.

---

## Quick Start

```bash
# Local (full features)
cd server && npm install && npx playwright install chromium && npm start

# Open http://localhost:3721
```

---

## Deploy

### Frontend → Vercel (free)

Deploy `client/` as a static site. Set env:

```
API_BASE = https://your-backend.onrender.com
```

### Backend → Render (free)

Deploy `server/` as a Node.js Web Service. Build command: `npm install && npx playwright install chromium`. Start command: `npm start`.

---

## Directory

```
magnesium-design/
├── client/                     # Frontend (Vercel)
│   ├── index.html
│   ├── app.js
│   ├── style.css
│   └── vercel.json
├── server/                     # Backend (Render)
│   ├── SKILL.md
│   ├── assets/
│   │   ├── animations.jsx      # Animation engine
│   │   ├── animation-format.js
│   │   ├── pptx-format.js
│   │   ├── providers.js
│   │   └── showcases/
│   ├── scripts/
│   │   ├── server.js           # Express entry
│   │   ├── api.js              # API routes
│   │   ├── llm-client.js       # LLM caller
│   │   ├── pipeline.js         # 3-phase pipeline
│   │   ├── render.js           # Playwright render
│   │   └── pptx-export.js      # PPTX export
│   ├── references/             # 23 knowledge docs
│   └── output/                 # Generated files
└── README.md
```

---

## Pipeline

```
User input
  ↓
Phase 1: Direction Advisor → 3 directions + Playwright demo screenshots
  ↓
Phase 2: Context Protocol → collect audience/tone/length
  ↓
Phase 3: Junior Designer → outline → confirm → full generation
  ↓
Output: HTML (visual design) + PNG (screenshot) + PPTX (computedStyle export)
```

Animation mode: prompt → AI writes animated HTML → Playwright records MP4.

---

## API

| Endpoint | Description |
|----------|-------------|
| `POST /api/advisor` | Recommend 3 content directions |
| `POST /api/context` | Gather context questions |
| `POST /api/outline` | Generate content outline |
| `POST /api/generate` | Generate full HTML content |
| `POST /api/animation` | Generate animated HTML → MP4 |
| `POST /api/export/pptx` | HTML → PPTX |
| `GET /api/providers` | List LLM providers |
| `GET /api/skill-status` | Skill load status |

---

## License

MIT

## Credits

Inspired by [Huashu-Design](https://github.com/alchaincyf/huashu-design) by [Huasheng](https://github.com/AlchainHust).
