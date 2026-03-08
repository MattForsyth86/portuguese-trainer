# Português Trainer — Technical Reference

> A self-contained Portuguese language trainer built for Seadrill / offshore rig work.
> No build step. No framework CLI. Pure HTML + React (CDN) + two Netlify serverless functions.

---

## 1. Project Structure

| File | Lines | Purpose |
|------|-------|---------|
| `index.html` | 751 | Entire frontend — CSS, data arrays, all React components, sync logic, app entry point |
| `netlify/functions/fetch-doc.js` | 61 | Serverless function: authenticates with Google, fetches the tutor's Google Doc as raw text |
| `netlify/functions/parse.js` | 90 | Serverless function: sends doc text to Claude Haiku, returns parsed JSON |
| `netlify.toml` | 11 | Netlify build config — functions dir, esbuild bundler, per-function timeouts |
| `package.json` | 12 | Node deps: `@anthropic-ai/sdk ^0.39.0`, `googleapis ^144.0.0`. One script: `"dev": "netlify dev"` |
| `package-lock.json` | — | Lockfile |
| `.gitignore` | 2 | Ignores `.netlify` directory only |

There is no build step. React 18.2, ReactDOM 18.2, and Babel Standalone 7.23.9 are loaded from CDNJS. All JSX is transpiled in-browser at runtime.

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend framework** | React 18.2.0 (CDN, production UMD builds) |
| **JSX transpilation** | Babel Standalone 7.23.9 (in-browser, runtime) |
| **Styling** | Vanilla CSS in a single inline `<style>` block, CSS custom properties for theming |
| **Fonts** | Google Fonts: Instrument Serif, DM Sans (400/500/600/700), DM Mono (400/500) |
| **Backend** | Two Netlify serverless functions (Node.js, esbuild-bundled) |
| **APIs** | Google Docs API v1 (read-only), Anthropic Claude Haiku API |
| **Persistence** | `localStorage` (no database) |
| **Deployment** | Netlify (static HTML + serverless functions) |
| **Dependencies** | `@anthropic-ai/sdk ^0.39.0`, `googleapis ^144.0.0` |
| **PWA** | iOS web app meta tags only — no service worker, no offline cache |

---

## 3. Hardcoded Data

All data lives in `index.html` inside a `<script type="text/babel">` block starting at line 99.

### 3.1 `VERBS` — **83 items** (line 102)

Schema:
```js
{
  infinitive: "estar",
  english: "to be (temporary)",
  type: "irregular",   // "irregular" | "regular_ar" | "regular_er" | "regular_ir"
  conjugations: {
    "presente":            { eu: "estou", "você": "está", "ele/ela": "está", "nós": "estamos", "eles/elas": "estão" },
    "pretérito perfeito":  { eu: "estive", "você": "esteve", ... },
    "pretérito imperfeito": { eu: "estava", ... }   // only on 3 verbs: ser, estar, ter
  }
}
```

**Breakdown by type:**

| Type | Count | Examples |
|------|-------|---------|
| `irregular` | 26 | ser, estar, ter, ir, fazer, ver, vir, poder, conseguir, saber, conhecer, querer, trazer, dar, dizer, pôr, sair, pedir, ler, ouvir, dormir, perder, esquecer, rir, descer, escrever |
| `regular_ar` | 42 | falar, voltar, ficar, precisar, trabalhar, comprar, olhar, puxar, empurrar, curtir*, receber* … |
| `regular_er` | 10 | comer, beber, entender, mexer, devolver, escolher, acontecer, nascer, morrer, viver |
| `regular_ir` | 5 | abrir, subir, existir, decidir, partir |

**Tense coverage:**

| Tense | Verb count |
|-------|-----------|
| `presente` | 83 (all) |
| `pretérito perfeito` | 83 (all) |
| `pretérito imperfeito` | 3 (ser, estar, ter only) |

---

### 3.2 `VOCABULARY` — **175 items** (lines 104–142)

Schema:
```js
{ portuguese: "casa", english: "house", category: "casa", gender: "a" }
// gender: "o", "a", or null
```

**Breakdown by category:**

| Category | Count | Category | Count |
|----------|-------|----------|-------|
| `essentials` | 24 | `food` | 10 |
| `greetings` | 5 | `nature` | 5 |
| `days` | 7 | `city` | 8 |
| `numbers` | 14 | `time` | 9 |
| `colors` | 6 | `feelings` | 7 |
| `family` | 10 | `connectors` | 12 |
| `body` | 8 | `adjectives` | 14 |
| `animals` | 5 | `rig` | 4 |
| `weather` | 6 | `clothing` | 5 |
| `professions` | 4 | | |

125 of 175 items have a non-null `gender` field and appear in the Gender Quiz.

---

### 3.3 `RIG_VOCAB` — **33 items** (lines 144–152)

Schema: identical to VOCABULARY. Maritime / offshore drilling terminology.

| Category | Count | Examples |
|----------|-------|---------|
| `ship` | 7 | casco (hull), proa (bow), popa (stern), convés (deck), escotilha (hatch), âncora (anchor), porão (cargo hold) |
| `drilling` | 7 | perfurar, poço (well), broca (drill bit), pressão, revestimento (casing), coluna (drill string), fluido |
| `operations` | 6 | válvula, bomba, mangueira, operação, manutenção, turno (shift) |
| `machines` | 4 | motor, gerador, guindaste (crane), máquina |
| `crew` | 4 | capitão, tripulação, marinheiro, chefe |
| `safety` | 3 | bote salva-vidas, colete salva-vidas, extintor |
| `rig` | 2 | eslinga (sling), gancho (hook) |

32 of 33 items have a non-null `gender` field (`perfurar` has `null` — it's a verb, not a noun).

---

### 3.4 `SER_ESTAR` — **20 items** (lines 154–175)

Schema:
```js
{ phrase: "Eu ___ muito feliz hoje.", answer: "estou", reason: "Temporary emotion", hint: "I am very happy today." }
```

**Answer distribution:** `está` ×8, `é` ×6, `estou` ×2, `sou` ×2, `são` ×1, `estamos` ×1.

---

### 3.5 `PREPOSITIONS` — **15 items** (lines 177–193)

Schema:
```js
{ phrase: "Eu moro ___ Brasil.", answer: "no", hint: "I live in Brazil.", rule: "em + o = no" }
```

Answers include: `no`, `de`, `à`, `às`, `com`, `para`, `ao`, `do`, `em`, `por`.

---

### 3.6 `PHRASES` (Fill-the-Gap) — **15 items** (lines 195–211)

Schema:
```js
{ phrase: "Bom ___, tudo bem?", answer: "dia", hint: "Good morning, all good?", category: "greetings" }
```

| Category | Count |
|----------|-------|
| `daily` | 6 |
| `rig` | 3 |
| `questions` | 3 |
| `greetings` | 2 |
| `past tense` | 1 |

---

### 3.7 `SENTENCES` (Sentence Builder) — **15 items** (lines 213–229)

Schema:
```js
{ english: "I go to work in Brazil.", words: ["Eu","vou","trabalhar","no","Brasil"], category: "daily" }
```

| Category | Count |
|----------|-------|
| `daily` | 7 |
| `rig` | 7 |
| `past` | 1 |

---

### 3.8 `RIG_SCENARIOS` — **10 items** (lines 231–242)

Schema:
```js
{
  situation: "A tool is broken on the rig floor",
  prompt: "Tell the crew the tool broke",
  answer: "A ferramenta quebrou",
  hint: "quebrar = to break",
  vocabulary: ["ferramenta","quebrou"]
}
```

---

### 3.9 Derived Data

Built at runtime in the `useTrainerData` hook (line 266):

```js
const allVocab = [...vocabulary, ...rigVocab];     // 175 + 33 = 208 items
const genderWords = allVocab.filter(v => v.gender); // 157 items with non-null gender
```

`genderWords` is the dataset for the Gender Quiz (`O vs A` mode).

---

## 4. Components

All components are plain functions defined in `index.html` lines 286–748 inside `<script type="text/babel">`. No imports/exports — everything is global.

### 4.1 Utility Components

| Component | Lines | Props | What it renders |
|-----------|-------|-------|----------------|
| *(none)* | — | — | There are no extracted utility components — `Card`, `Btn`, `Label`, `Input`, etc. are **not** in this codebase. All UI primitives are inlined as raw HTML/CSS classes within drill components. |

### 4.2 Drill Components

| Component | Lines | Props | Input type | Answer checking |
|-----------|-------|-------|-----------|----------------|
| `Conjugar` | 286–349 | `{ verbs, onRecord }` | Text input | `normalize()` — accent-stripping (lenient) |
| `VocabQuiz` | 351–392 | `{ vocab, onRecord }` | 4-option multiple choice | Button identity match |
| `GenderDrill` | 394–423 | `{ words, onRecord }` | 2-button `o`/`a` | Button identity match (`g === q.gender`) |
| `SerEstarDrill` | 425–456 | `{ data, onRecord }` | 4-option multiple choice | Button identity match (`o === q.answer`) |
| `PrepDrill` | 458–489 | `{ data, onRecord }` | Text input | `normalize()` — accent-stripping (lenient) |
| `FillGap` | 491–519 | `{ data, onRecord }` | Text input | `normalize()` — accent-stripping (lenient) |
| `SentenceBuilder` | 521–569 | `{ data, onRecord }` | Tap-to-order word tiles | `normalize()` on joined string vs expected |
| `RigScenario` | 571–602 | `{ data, onRecord }` | Text input + show hint toggle | `normalize()` — accent-stripping (lenient) |

### 4.3 App Component (lines 607–748)

`App` is the root component. It:
- Calls `useTrainerData()` to get all merged datasets
- Owns `stats` state and the `record()` callback
- Renders the header, score bar, sync bar, mode grid (8 modes), and the active drill component
- Contains the `doSync()` function for Google Doc sync
- Manages sync UI state (`syncing`, `syncMsg`)

### 4.4 Answer Checking — `normalize()` (line 249)

There is one single normalize function used across all text-input modes:

```js
const normalize = s => s?.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").trim();
```

This strips all diacritics (accents) and lowercases. All text-input drills compare `normalize(input) === normalize(answer)`.

**There is no strict (accent-requiring) mode.** Every text-input drill uses the same lenient normalization. Accent errors always count as correct.

The multiple-choice and button drills (`VocabQuiz`, `GenderDrill`, `SerEstarDrill`) compare button values directly — no normalization needed.

---

## 5. State Management

### 5.1 All `useState` hooks

**App component (line 607):**

| Hook | Initial value | Persists to localStorage? |
|------|--------------|--------------------------|
| `mode` | `"conjugar"` | No |
| `stats` | `LS.get("stats", {correct:0, total:0, streak:0, best:0})` | **Yes** — `pt2-stats` |
| `syncing` | `false` | No |
| `syncMsg` | `LS.get("syncMsg", "")` | **Yes** — `pt2-syncMsg` |

`lastSync` is read directly via `LS.get("lastSync","")` on every render (not a useState hook, line 613).

**Conjugar (line 286):**

| Hook | Purpose |
|------|---------|
| `tense` | Currently selected tense filter (`"presente"` default) |
| `vFilter` | Verb type filter (`"all"` default) |
| `q` | Current question object `{ verb, pronoun, answer }` |
| `input` | User's typed input |
| `result` | `{ correct: boolean, answer: string }` or `null` |

**VocabQuiz (line 351):**

| Hook | Purpose |
|------|---------|
| `dir` | Direction — `"pt-en"` or `"en-pt"` |
| `q` | Current question `{ word, opts: [4 words] }` |
| `selected` | Index of selected option or `null` |

**GenderDrill (line 394):**

| Hook | Purpose |
|------|---------|
| `q` | Current word object from `genderWords` |
| `selected` | Selected gender (`"o"`, `"a"`) or `null` |

**SerEstarDrill (line 425):**

| Hook | Purpose |
|------|---------|
| `q` | Current SER_ESTAR item |
| `selected` | Index of selected option or `null` |

**PrepDrill (line 458), FillGap (line 491):**

| Hook | Purpose |
|------|---------|
| `q` | Current item |
| `input` | User's typed input |
| `result` | `{ correct: boolean }` or `null` |

**SentenceBuilder (line 521):**

| Hook | Purpose |
|------|---------|
| `q` | Current sentence item |
| `placed` | Array of `{w, id}` objects placed by user |
| `bank` | Shuffled array of `{w, id}` word chips |
| `result` | `{ correct, expected }` or `null` |

**RigScenario (line 571):**

| Hook | Purpose |
|------|---------|
| `q` | Current scenario item |
| `input` | User's typed input |
| `result` | `{ correct: boolean }` or `null` |
| `showHint` | Whether hint is revealed |

### 5.2 localStorage Key Scheme

All keys are prefixed `pt2-` via the `LS` helper (line 251):

```js
const LS = {
  get: (k,d) => { try { const v = localStorage.getItem("pt2-"+k); return v ? JSON.parse(v) : d; } catch { return d; }},
  set: (k,v) => { try { localStorage.setItem("pt2-"+k, JSON.stringify(v)); } catch {} },
};
```

| Key | Type | Contents |
|-----|------|---------|
| `pt2-stats` | JSON | `{ correct: number, total: number, streak: number, best: number }` |
| `pt2-synced` | JSON | Full sync payload: `{ verbs[], vocabulary[], rig_vocab[], ser_estar[], prepositions[], phrases[], sentences[], rig_scenarios[] }` |
| `pt2-syncMsg` | JSON string | Last sync status message (e.g. `"✓ +2 verbs, +5 words"`) |
| `pt2-lastSync` | JSON string | Formatted timestamp (e.g. `"24 Feb, 14:30"`) |

---

## 6. Scoring System

### 6.1 `record()` callback (line 617)

Every drill component receives `onRecord` as a prop. When the user answers, the drill calls `onRecord(true)` or `onRecord(false)`.

```js
const record = (correct) => {
  setStats(s => {
    const streak = correct ? s.streak + 1 : 0;
    return { correct: s.correct + (correct?1:0), total: s.total + 1, streak, best: Math.max(s.best, streak) };
  });
};
```

### 6.2 Stats tracked

| Field | Meaning | Reset on wrong? |
|-------|---------|-----------------|
| `correct` | Total correct answers this session | No (cumulative) |
| `total` | Total answers this session | No (cumulative) |
| `streak` | Current consecutive correct answers | **Yes** — resets to 0 |
| `best` | Highest streak ever achieved | Never resets |

### 6.3 Persistence

Stats **are persisted** to `localStorage` via `pt2-stats`. This happens on every state change via:

```js
useEffect(() => { LS.set("stats", stats); }, [stats]);  // line 615
```

Stats survive page refreshes. They are loaded from localStorage on mount (line 610):

```js
const [stats, setStats] = useState(LS.get("stats",{correct:0,total:0,streak:0,best:0}));
```

### 6.4 Display (line 712)

```js
const pct = stats.total > 0 ? Math.round(stats.correct/stats.total*100) : 0;
```

Score bar shows: 🔥 streak | ✓ correct/total | pct%

---

## 7. Sync Pipeline

### 7.1 Overview

The sync button triggers `doSync()` (line 624). The flow:

```
User clicks "Sync"
    │
    ▼
GET /.netlify/functions/fetch-doc
    │ Returns { text, charCount }
    ▼
For each section in ["verbs", "vocabulary", "exercises"]  (sequential)
    │
    POST /.netlify/functions/parse
    │ body: { text, section }
    │ Returns { data, section }
    ▼
Build syncData object
    │
    ▼
LS.set("synced", syncData)
    │
    ▼
Calculate "+N verbs, +N words" message
    │
    ▼
React re-renders with merged data via useTrainerData()
```

**Note:** Only 3 sections are synced — `"verbs"`, `"vocabulary"`, `"exercises"`. There is no separate `"rig"` section. Rig vocab is extracted client-side from the vocabulary results (line 660):

```js
rig_vocab: results.vocabulary?.filter(v =>
  ["rig","ship","drilling","operations","machines","crew","safety","navigation"].includes(v.category)
) || [],
```

### 7.2 `fetch-doc.js` (61 lines)

**Trigger:** `GET /.netlify/functions/fetch-doc`

**Authentication:**
```js
const auth = new google.auth.JWT(
  process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  null,
  process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  ["https://www.googleapis.com/auth/documents.readonly"]
);
```

**Extraction logic:** Iterates `res.data.body.content`:
- **Paragraphs:** concatenates all `textRun.content` strings
- **Tables:** concatenates cell text with `\t` between cells, `\n` between rows

**Response:** `{ text: "<full doc>", charCount: N }` (HTTP 200)
**Error:** `{ error: "Fetch failed", message: "..." }` (HTTP 500)

CORS headers: `Access-Control-Allow-Origin: *`, `Access-Control-Allow-Headers: Content-Type`

### 7.3 `parse.js` (90 lines)

**Trigger:** `POST /.netlify/functions/parse`
**Body:** `{ text: "<doc text>", section: "verbs"|"vocabulary"|"exercises" }`

**Text truncation (line 36):**
```js
const docText = text.substring(0, 12000);
```

All sections receive at most **12,000 characters** of the raw doc text. There is **no keyword pre-filtering** — the full (truncated) doc text is sent to Claude.

**Model and settings (line 69):**
```js
model: "claude-haiku-4-5-20251001"
max_tokens: 4096
```

No system prompt. No temperature setting. Single user message.

#### Prompt: `section = "verbs"` (lines 40–47)

```
Extract ALL verbs from this Portuguese lesson. For each verb provide conjugations for tenses found in the document (presente, pretérito perfeito, pretérito imperfeito, imperativo).

Return ONLY a JSON array:
[{"infinitive":"ser","english":"to be","type":"irregular","conjugations":{"presente":{"eu":"sou","você":"é","ele/ela":"é","nós":"somos","eles/elas":"são"}}}]

type: irregular, regular_ar, regular_er, regular_ir. Include verbs from example sentences too.

TEXT:
<docText>
```

#### Prompt: `section = "vocabulary"` (lines 49–58)

```
Extract ALL vocabulary words (NOT verbs) from this Portuguese lesson. Include nouns, adjectives, adverbs, expressions from examples.

Return ONLY a JSON array:
[{"portuguese":"casa","english":"house","category":"casa","gender":"a"}]

Categories: essentials,greetings,days,numbers,colors,family,body,animals,weather,clothing,professions,casa,food,nature,city,time,feelings,connectors,adjectives,rig
Gender: "o","a", or null.

TEXT:
<docText>
```

#### Prompt: `section = "exercises"` (lines 60–66)

```
From this Portuguese lesson, create practice exercises. Return ONLY valid JSON:
{"ser_estar":[{"phrase":"Eu ___ feliz.","answer":"estou","reason":"Temporary","hint":"I am happy."}],"prepositions":[{"phrase":"Eu moro ___ Brasil.","answer":"no","hint":"I live in Brazil.","rule":"em+o=no"}],"phrases":[{"phrase":"Bom ___, tudo bem?","answer":"dia","hint":"Good morning?","category":"greetings"}],"sentences":[{"english":"I go to work.","words":["Eu","vou","trabalhar"],"category":"daily"}],"rig_scenarios":[{"situation":"Tool is broken","prompt":"Tell crew it broke","answer":"A ferramenta quebrou","hint":"quebrar=to break","vocabulary":["ferramenta","quebrou"]}]}

Generate 8-10 items per type using content from the document.

TEXT:
<docText>
```

#### CORS preflight (line 28)

```js
if (event.httpMethod === "OPTIONS") {
  return { statusCode: 204, headers, body: "" };
}
```

#### JSON recovery: `recoverJSON()` (lines 5–18)

Strips markdown fences, then attempts progressively looser parsing:

```js
function recoverJSON(text) {
  let clean = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  try { return JSON.parse(clean); } catch(e) {}          // 1. parse as-is
  if (clean.startsWith("[")) {
    const last = clean.lastIndexOf("},");
    if (last > 0) try { return JSON.parse(
      clean.substring(0, last + 1) + "]"); } catch(e) {}  // 2. truncated array: close at last "},{"
    const lastB = clean.lastIndexOf("}");
    if (lastB > 0) try { return JSON.parse(
      clean.substring(0, lastB + 1) + "]"); } catch(e) {} // 3. close at last "}"
  }
  if (clean.startsWith("{")) {
    const lastArr = clean.lastIndexOf("]");
    if (lastArr > 0) try { return JSON.parse(
      clean.substring(0, lastArr + 1) + "}"); } catch(e) {} // 4. truncated object: close at last "]"
  }
  throw new Error("Could not parse JSON response");
}
```

### 7.4 Merge / Deduplication (lines 259–281)

```js
function mergeData(base, synced, keyFn) {
  if (!synced?.length) return base;
  const seen = new Set(base.map(keyFn));
  const newItems = synced.filter(i => !seen.has(keyFn(i)));
  return [...base, ...newItems];
}
```

**Key fields by data type:**

| Data type | Key function |
|-----------|-------------|
| verbs | `v => v.infinitive` |
| vocabulary | `v => v.portuguese` |
| rigVocab | `v => v.portuguese` |
| serEstar | `v => v.phrase` |
| prepositions | `v => v.phrase` |
| phrases | `v => v.phrase` |
| sentences | `v => v.english` |
| rigScenarios | `v => v.situation` |

Hardcoded items always win — synced items are only appended if their key doesn't exist in the hardcoded set.

### 7.5 Sync Status Message (lines 672–678)

After sync completes, the status message is calculated by comparing merged length vs hardcoded baseline:

```js
const newVerbs = mergeData(VERBS, syncData.verbs, v=>v.infinitive).length - VERBS.length;
const newVocab = mergeData(VOCABULARY, syncData.vocabulary, v=>v.portuguese).length - VOCABULARY.length;
const msg = `✓ +${newVerbs} verbs, +${newVocab} words`;
```

**Rig vocab additions are not shown** — only verbs and vocabulary counts appear in the message.

---

## 8. Styling

### 8.1 CSS Custom Properties (lines 17–25)

All defined on `:root`:

```css
/* Background layers */
--bg: #0c1222;                          /* Main page background */
--surface: #151d30;                     /* Elevated surfaces (sync bar, inputs) */
--card: #1a2540;                        /* Card backgrounds */
--card-hover: #1f2d4a;                  /* Card hover state */

/* Borders & text */
--border: #243049;                      /* All borders */
--text: #e8ecf4;                        /* Primary text */
--text2: #8899b4;                       /* Secondary text */
--text3: #5a6a86;                       /* Muted/placeholder text */

/* Semantic colors */
--green: #22c55e;                       /* Primary action, correct answer */
--green-dim: #166534;                   /* Dark green (unused in CSS — only defined) */
--green-bg: rgba(34,197,94,0.12);       /* Correct answer background */
--red: #ef4444;                         /* Wrong answer */
--red-bg: rgba(239,68,68,0.12);         /* Wrong answer background */
--amber: #f59e0b;                       /* Streak counter */
--amber-bg: rgba(245,158,11,0.12);      /* (unused in CSS — only defined) */
--blue: #3b82f6;                        /* (unused in CSS — only defined) */

/* Radius */
--radius: 12px;                         /* Cards, large elements */
--radius-sm: 8px;                       /* Inputs, buttons, pills */
```

**Note:** `--green-dim`, `--amber-bg`, and `--blue` are defined but never referenced in any CSS rule or inline style.

### 8.2 Typography

| Role | Font family | Where used |
|------|-------------|-----------|
| Logo (`.logo`) | `'Instrument Serif', serif` | Header title, `.drill-card .word`, gender quiz buttons |
| UI / body | `'DM Sans', sans-serif` | Default for `html,body`, all buttons, labels |
| Text inputs | `'DM Mono', monospace` | `input` elements (answer fields) |

Font weights loaded: DM Sans 400/500/600/700, DM Mono 400/500, Instrument Serif regular + italic.

### 8.3 Layout

- **Mobile-first** single column — `.app` container is `max-width: 480px`, centred with `margin: 0 auto`
- **Full viewport height** — `html,body` and `#root` are `height: 100%`; body has `overflow: hidden`
- **Flexbox** throughout — `.app` is a vertical flex column; `.drill-area` is the scrollable flex child (`flex: 1; overflow-y: auto`)
- **Mode grid** — `display: grid; grid-template-columns: repeat(3, 1fr)` — 3-column layout for 8 mode buttons
- **Desktop border** — media query at 768px adds left/right borders to `.app`
- **Animations** — `fadeIn` keyframe (opacity 0→1, translateY 8px→0) on `.drill-card`; `pulse` keyframe on sync dot

### 8.4 Component CSS Patterns

| Pattern | Classes | Styles |
|---------|---------|--------|
| **Cards** | `.drill-card` | `background: var(--card)`, 1px border, 12px radius, 24px padding, fadeIn animation |
| **Primary button** | `.go-btn`, `.sync-btn` | Green background, black text, bold, 8px radius |
| **Secondary button** | `.next-btn` | Surface background, light text, full width |
| **Option buttons** | `.opt-btn` | Surface bg, 1.5px border, 15px font. States: `.selected-correct` (green bg+border), `.selected-wrong` (red bg+border), `.show-correct` (green border) |
| **Filter pills** | `.filter-pill` | Pill shape (20px radius), surface bg. Active: green bg + border + text |
| **Mode buttons** | `.mode-btn` | Card bg, 1.5px border, 12px font. Active: green bg + border + text |
| **Word chips** | `.word-chip` | Card bg, 6px radius. `.placed`: opacity 0.3, pointer-events none. In `.sentence-build`: green bg + border |
| **Feedback** | `.feedback.correct` | Green bg + green text. `.feedback.wrong`: red bg + red text |
| **Text inputs** | `input` | Surface bg, 2px border, monospace 18px. Focus: green border. Placeholder: muted text |

---

## 9. Environment Variables

| Variable | Used in | Description |
|----------|---------|-------------|
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | `fetch-doc.js` line 12 | Google Cloud service account email |
| `GOOGLE_PRIVATE_KEY` | `fetch-doc.js` line 14 | RSA private key. Store with literal `\n` — the function replaces `\\n` with real newlines |
| `GOOGLE_DOC_ID` | `fetch-doc.js` line 20 | The document ID from the Google Doc URL (`/document/d/<THIS>/edit`) |
| `ANTHROPIC_API_KEY` | `parse.js` line 3 | Anthropic API key for Claude Haiku |

For local dev: create a `.env` file in the project root.
For production: set in Netlify → Site Settings → Environment Variables.

---

## 10. Netlify Configuration

`netlify.toml` (11 lines):

```toml
[build]
  functions = "netlify/functions"    # Source directory for serverless functions

[functions]
  node_bundler = "esbuild"           # Bundle each function with esbuild (fast, tree-shaking)

[functions.fetch-doc]
  timeout = 15                       # 15-second timeout (Google API call)

[functions.parse]
  timeout = 26                       # 26-second timeout (Claude API call)
```

The default Netlify function timeout is 10 seconds. Both functions are given elevated timeouts to account for external API latency.

---

## 11. Known Issues & Quirks

### Verb type misclassifications

**`curtir` (to enjoy)** — typed as `regular_ar` (line 102) but the infinitive ends in `-ir`. It should be `regular_ir` or `irregular`. Its conjugations are also wrong: `você: "curta"`, `nós: "curtamos"` are subjunctive forms, not indicative presente. Correct indicative: `você: "curte"`, `nós: "curtimos"`.

**`receber` (to receive)** — typed as `regular_ar` (line 102) but the infinitive ends in `-er`. It should be `regular_er`. Its conjugations are also wrong: `você: "receba"` is subjunctive; pretérito perfeito `eu: "recebei"`, `você: "recebou"` are not valid Portuguese forms. Correct: `você: "recebe"` (presente), `eu: "recebi"`, `você: "recebeu"` (pretérito perfeito).

**`acontecer`** and **`nascer`** — typed as `regular_er` but have stem changes in eu-presente: `eu aconteço` (c→ç), `eu nasço` (c→ç). These are common orthographic changes but technically deviate from perfectly regular patterns.

### `doSync` runs only 3 sections, not 4

The sync loop (line 636) iterates `["verbs","vocabulary","exercises"]` — only 3 parse calls. `parse.js` has no `section === "rig"` branch. Rig vocab is extracted client-side by filtering vocabulary results by category (line 660). The category list used for filtering includes `"navigation"` which does not exist in any hardcoded or likely synced data.

### SerEstarDrill option generation (lines 434–437)

```js
const serOpts = ["sou","é","somos","são"];
const estarOpts = ["estou","está","estamos","estão"];
const allOpts = [...new Set([q.answer, ...shuffle([...serOpts,...estarOpts])])].slice(0,4);
```

All 8 forms are pooled, shuffled, deduplicated with the answer, then sliced to 4. The correct answer is guaranteed to appear, but the option set is always drawn from the same 8 forms. A follow-up line ensures the answer is included:

```js
const opts = shuffle(allOpts.includes(q.answer) ? allOpts : [q.answer, ...allOpts.slice(0,3)]);
```

### Shuffle is biased (line 247)

```js
const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);
```

`sort` with a random comparator does not produce uniform shuffles — it's biased by the sort algorithm. Fisher-Yates would be correct.

### Unused CSS variables

`--green-dim`, `--amber-bg`, and `--blue` are defined in `:root` (lines 20–23) but never referenced in any CSS selector or inline style in the entire file.

### `.gitignore` only ignores `.netlify`

The `.gitignore` (2 lines) only excludes `.netlify`. It does **not** ignore `node_modules/`, `.env`, or `package-lock.json`. If `node_modules/` exists locally, it could be committed accidentally if not already covered by a global gitignore.

### VocabQuiz direction state reset

When the user toggles between `PT → EN` and `EN → PT`, the `useEffect` on line 364 generates a new question:

```js
useEffect(() => { if(vocab.length) next(); }, [dir, vocab.length]);
```

But `next` is not in the dependency array — it references a stale closure of `vocab`. This works in practice because `vocab` is stable (memoized), but is technically a React hooks lint violation.

### PWA meta tags but no service worker

Lines 6–10 include iOS web app meta tags and an inline `data:` manifest, but there is no service worker registration. The app works in "Add to Home Screen" mode on iOS but has no offline capability.

### `fetch-doc.js` uses GET but `doSync` sends GET

The `fetch-doc.js` handler signature is `exports.handler = async () =>` — it ignores `event` entirely and always runs. The client calls it with `fetch("/.netlify/functions/fetch-doc")` (GET, no body). This works but means the function can't distinguish between methods.

### `parse.js` accepts OPTIONS but `fetch-doc.js` does not

`parse.js` (line 28) has an explicit CORS preflight handler for OPTIONS. `fetch-doc.js` does not — it will try to run the full Google Docs fetch on an OPTIONS request and return a 200 with actual data, or 500 if it fails.

### Sentence builder word removal is last-only

Line 556:
```jsx
<div className="sentence-build" onClick={()=>{if(placed.length)removeWord(placed[placed.length-1])}}>
```

Clicking the build area always removes the **last** placed word, not the word clicked on. There is no way to remove a word from the middle.

### `SER_ESTAR` count is 20, not 23

The actual array has 20 items (lines 154–175), not 23 as one might expect from rounded descriptions.

---

## 12. Running Locally

```bash
npm install                  # installs googleapis + @anthropic-ai/sdk
```

Create a `.env` file with all 4 env vars from Section 9, then:

```bash
npx netlify dev              # or: npm run dev
```

This starts a local dev server on `http://localhost:8888` with function emulation.

**The Sync button only works via the dev server.** Opening `index.html` directly (file://) will cause `fetch("/.netlify/functions/...")` to fail.

## 13. Deployment

Push to a Git repo connected to Netlify, or deploy manually:

```bash
npx netlify deploy --prod
```

Netlify will:
1. Serve `index.html` as the static site
2. Bundle each `.js` file in `netlify/functions/` with esbuild into a `.zip` deployment artifact
3. Expose them at `/.netlify/functions/<name>`

Set the 4 environment variables in Netlify → Site Settings → Environment Variables.

---

*Built from Sophia's lessons · Seadrill edition*
