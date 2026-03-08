# Portugues Trainer

A mobile-friendly Portuguese language trainer built for offshore rig workers. Zero build step frontend — pure HTML + React (CDN) with an Express backend on Digital Ocean App Platform.

---

## Project Structure

```
portuguese-trainer/
├── index.html                    # Entire frontend app (React, CSS, data, components)
├── server.js                     # Express server (API routes, sync pipeline, cron)
├── data.json                     # Cached sync data (auto-generated, persistent disk)
├── Dockerfile                    # Digital Ocean App Platform container
├── .dockerignore
├── package.json
└── .gitignore
```

## Tech Stack

| Layer       | Technology                                          |
|-------------|-----------------------------------------------------|
| Frontend    | React 18.2 + Babel Standalone (CDN, in-browser JSX) |
| Styling     | Vanilla CSS with custom properties (dark theme)     |
| Backend     | Express (Node.js)                                   |
| AI          | Anthropic Claude Opus 4.6 (content parsing)         |
| Data Source | Google Docs API v1                                  |
| Storage     | localStorage (client) + data.json (server)          |
| Scheduling  | node-cron (weekly auto-sync)                        |
| Hosting     | Digital Ocean App Platform                          |
| Fonts       | Instrument Serif, DM Sans, DM Mono                  |

## API Endpoints

| Method | Route       | Description                              |
|--------|-------------|------------------------------------------|
| GET    | `/api/data` | Returns cached data.json instantly       |
| POST   | `/api/data` | Save stats or sync data from client      |
| POST   | `/api/sync` | Triggers full sync (fetch doc + parse)   |

## Training Modes

The app includes **8 drill types**:

| Mode              | Input Type       | Description                                    |
|-------------------|------------------|------------------------------------------------|
| **Conjugar**      | Text field       | Verb conjugation across 3 tenses, 83 verbs     |
| **Vocab Quiz**    | Multiple choice  | 175 words, toggle PT→EN / EN→PT                |
| **O vs A**        | 2-button select  | Grammatical gender drill (157 nouns)            |
| **Ser/Estar**     | Multiple choice  | 20 contextual sentences with explanations       |
| **Prepositions**  | Text field       | 15 fill-in-the-blank preposition exercises      |
| **Phrases**       | Text field       | 15 phrases (daily, rig, greetings, past tense)  |
| **Sentence Builder** | Tap word tiles | Reorder words into correct Portuguese sentences |
| **Rig Scenarios** | Text field       | 10 offshore drilling situation exercises        |

## Getting Started

### Prerequisites

- Node.js 20+

### Environment Variables

Create a `.env` file in the project root (or set in DO App Platform dashboard):

```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----
GOOGLE_DOC_ID=your-google-doc-id
ANTHROPIC_API_KEY=sk-ant-...
```

### Run Locally

```bash
npm install
npm start          # runs Express on http://localhost:8080
```

### Docker

```bash
docker build -t portuguese-trainer .
docker run -p 8080:8080 --env-file .env portuguese-trainer
```

### Deploy to Digital Ocean

1. Push repo to GitHub
2. Create a new App in DO App Platform
3. Select the repo, DO will detect the Dockerfile
4. Set the 4 environment variables in the App settings
5. Attach a persistent disk mounted at `/app` (so `data.json` survives deploys)

## Sync Pipeline

```
User taps "Sync" (or weekly cron fires)
  → server.js fetches Google Doc text via service account
  → Text sent to Claude Opus 4.6 for structured extraction (verbs, vocabulary, exercises)
  → Results merged with existing cached data (dedup by key)
  → Saved to data.json on persistent disk
  → Client receives merged data and updates localStorage
```

Auto-sync runs every Sunday at 03:00 via node-cron.

## Scoring

- **Streak** — consecutive correct answers (resets on wrong)
- **Best** — highest streak ever achieved
- **Correct / Total** — cumulative, never resets
- Stats persist in localStorage + server-side data.json
