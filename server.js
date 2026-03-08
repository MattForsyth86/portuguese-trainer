const express = require("express");
const fs = require("fs");
const path = require("path");
const cron = require("node-cron");
const { google } = require("googleapis");
const Anthropic = require("@anthropic-ai/sdk").default;

const app = express();
const PORT = process.env.PORT || 8080;
const DATA_FILE = path.join(__dirname, "data.json");

app.use(express.json());
app.use(express.static(__dirname));

// ---------- helpers ----------

function loadCache() {
  try {
    if (fs.existsSync(DATA_FILE)) return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  } catch {}
  return {};
}

function saveCache(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function recoverJSON(text) {
  let clean = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  try { return JSON.parse(clean); } catch {}
  if (clean.startsWith("[")) {
    const last = clean.lastIndexOf("},");
    if (last > 0) try { return JSON.parse(clean.substring(0, last + 1) + "]"); } catch {}
    const lastB = clean.lastIndexOf("}");
    if (lastB > 0) try { return JSON.parse(clean.substring(0, lastB + 1) + "]"); } catch {}
  }
  if (clean.startsWith("{")) {
    const lastArr = clean.lastIndexOf("]");
    if (lastArr > 0) try { return JSON.parse(clean.substring(0, lastArr + 1) + "}"); } catch {}
  }
  throw new Error("Could not parse JSON response");
}

// ---------- Google Doc fetch ----------

async function fetchDoc() {
  console.log("[fetch] Email:", process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
  console.log("[fetch] Doc ID:", process.env.GOOGLE_DOC_ID);
  console.log("[fetch] Key starts with:", process.env.GOOGLE_PRIVATE_KEY?.substring(0, 30));

  const auth = new google.auth.JWT(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    null,
    process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    ["https://www.googleapis.com/auth/documents.readonly"]
  );

  const docs = google.docs({ version: "v1", auth });
  const res = await docs.documents.get({ documentId: process.env.GOOGLE_DOC_ID });

  let text = "";
  const content = res.data.body?.content || [];
  for (const el of content) {
    if (el.paragraph?.elements) {
      for (const e of el.paragraph.elements) {
        if (e.textRun?.content) text += e.textRun.content;
      }
    }
    if (el.table) {
      for (const row of el.table.tableRows || []) {
        for (const cell of row.tableCells || []) {
          for (const cellContent of cell.content || []) {
            if (cellContent.paragraph?.elements) {
              for (const e of cellContent.paragraph.elements) {
                if (e.textRun?.content) text += e.textRun.content;
              }
            }
          }
          text += "\t";
        }
        text += "\n";
      }
    }
  }
  return text;
}

// ---------- Claude parse ----------

async function parseSection(text, section) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const docText = text.substring(0, 12000);
  let prompt = "";

  if (section === "verbs") {
    prompt = `You are a Portuguese language expert. Extract EVERY verb from this Portuguese lesson document — including verbs that appear in example sentences, exercises, dialogues, and vocabulary lists. Be thorough: do not skip any verb.

For each verb, provide conjugations for ALL tenses mentioned or demonstrated in the document. Common tenses: presente, pretérito perfeito, pretérito imperfeito, imperativo.

IMPORTANT:
- Include ALL pronouns: eu, você, ele/ela, nós, eles/elas
- If a verb appears in ANY context (example sentence, conjugation table, exercise), extract it
- Classify type correctly: irregular (stem changes or unique forms), regular_ar, regular_er, regular_ir
- For regular verbs, provide the standard conjugation pattern even if only one form appears in the text

Return ONLY a JSON array, no other text:
[{"infinitive":"ser","english":"to be","type":"irregular","conjugations":{"presente":{"eu":"sou","você":"é","ele/ela":"é","nós":"somos","eles/elas":"são"},"pretérito perfeito":{"eu":"fui","você":"foi","ele/ela":"foi","nós":"fomos","eles/elas":"foram"}}}]

TEXT:\n` + docText;

  } else if (section === "vocabulary") {
    prompt = `You are a Portuguese language expert. Extract ALL vocabulary words (NOT verbs) from this Portuguese lesson. Be thorough — include every noun, adjective, adverb, expression, and phrase that appears anywhere in the document (headings, examples, exercises, dialogues).

IMPORTANT:
- Do NOT include verbs (infinitives or conjugated forms)
- DO include: nouns, adjectives, adverbs, prepositions, conjunctions, expressions, greetings
- For nouns, always specify the correct gender article ("o" for masculine, "a" for feminine, null for non-gendered words)
- Choose the most specific category that fits

Return ONLY a JSON array, no other text:
[{"portuguese":"casa","english":"house","category":"casa","gender":"a"}]

Categories: essentials,greetings,days,numbers,colors,family,body,animals,weather,clothing,professions,casa,food,nature,city,time,feelings,connectors,adjectives,rig
Gender: "o","a", or null for non-nouns.

TEXT:\n` + docText;

  } else if (section === "exercises") {
    prompt = `You are a Portuguese language teacher creating diverse, engaging practice exercises from a lesson document. Generate exercises that cover DIFFERENT topics, vocabulary, and sentence structures — avoid repetition.

RULES FOR VARIETY:
- Each exercise item must use DIFFERENT vocabulary and grammar from the others
- Mix everyday situations (shopping, travel, weather, family) with work/rig contexts
- Vary sentence complexity: some simple, some with subordinate clauses
- For fill-in-the-blank: the blank should test different grammar points (not always the same word type)
- For sentences: mix present, past, and future tenses
- Use vocabulary and grammar from the lesson document but create ORIGINAL sentences (not copied verbatim)

Return ONLY valid JSON with 10-12 items per type:
{"ser_estar":[{"phrase":"Eu ___ feliz.","answer":"estou","reason":"Temporary state/emotion","hint":"I am happy."}],"prepositions":[{"phrase":"Eu moro ___ Brasil.","answer":"no","hint":"I live in Brazil.","rule":"em+o=no"}],"phrases":[{"phrase":"Bom ___, tudo bem?","answer":"dia","hint":"Good morning, how are you?","category":"greetings"}],"sentences":[{"english":"I go to work.","words":["Eu","vou","trabalhar"],"category":"daily"}],"rig_scenarios":[{"situation":"Tool is broken","prompt":"Tell the crew what happened","answer":"A ferramenta quebrou","hint":"quebrar=to break","vocabulary":["ferramenta","quebrou"]}]}

IMPORTANT for ser_estar: always include "reason" explaining WHY ser or estar is used (permanent vs temporary, location, emotion, etc.)
IMPORTANT for sentences: the "words" array must contain the CORRECT word order when joined with spaces.
IMPORTANT for phrases: use varied categories (greetings, daily, rig, questions, past, food, travel, weather).

TEXT:\n` + docText;
  }

  const response = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const responseText = response.content[0]?.text || "";
  return recoverJSON(responseText);
}

// ---------- Full sync pipeline ----------

async function runSync() {
  console.log("[sync] Starting sync...");
  try {
    const text = await fetchDoc();
    if (!text) throw new Error("Empty doc");

    const sections = ["verbs", "vocabulary", "exercises"];
    const results = {};

    for (const section of sections) {
      console.log(`[sync] Parsing ${section}...`);
      try {
        results[section] = await parseSection(text, section);
      } catch (err) {
        console.error(`[sync] Failed to parse ${section}:`, err.message);
        results[section] = null;
      }
    }

    const existing = loadCache();
    const prevSynced = existing.synced || {};

    const mergeSynced = (prev, curr, keyFn) => {
      if (!curr?.length) return prev || [];
      if (!prev?.length) return curr;
      const seen = new Set(prev.map(keyFn));
      return [...prev, ...curr.filter(i => !seen.has(keyFn(i)))];
    };

    const syncData = {
      verbs: mergeSynced(prevSynced.verbs, results.verbs, v => v.infinitive),
      vocabulary: mergeSynced(prevSynced.vocabulary, results.vocabulary, v => v.portuguese),
      rig_vocab: mergeSynced(prevSynced.rig_vocab, results.vocabulary?.filter(v =>
        ["rig","ship","drilling","operations","machines","crew","safety","navigation"].includes(v.category)
      ), v => v.portuguese),
      ser_estar: mergeSynced(prevSynced.ser_estar, results.exercises?.ser_estar, v => v.phrase),
      prepositions: mergeSynced(prevSynced.prepositions, results.exercises?.prepositions, v => v.phrase),
      phrases: mergeSynced(prevSynced.phrases, results.exercises?.phrases, v => v.phrase),
      sentences: mergeSynced(prevSynced.sentences, results.exercises?.sentences, v => v.english),
      rig_scenarios: mergeSynced(prevSynced.rig_scenarios, results.exercises?.rig_scenarios, v => v.situation),
    };

    const now = new Date().toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

    const cached = {
      ...existing,
      synced: syncData,
      lastSync: now,
      syncMsg: "✓ Synced",
    };

    saveCache(cached);
    console.log("[sync] Sync complete at", now);
    return cached;
  } catch (err) {
    console.error("[sync] Sync failed:", err.message);
    if (err.response) console.error("[sync] API response:", err.response.status, err.response.statusText);
    if (err.errors) console.error("[sync] Errors:", JSON.stringify(err.errors));
    throw err;
  }
}

// ---------- API routes ----------

// GET /api/data — return cached data instantly
app.get("/api/data", (req, res) => {
  const data = loadCache();
  res.json(data);
});

// POST /api/data — save stats/data from client
app.post("/api/data", (req, res) => {
  try {
    const body = req.body;
    const existing = loadCache();

    if (body.action === "save") {
      const updated = {
        ...existing,
        synced: body.synced !== undefined ? body.synced : existing.synced,
        stats: body.stats !== undefined ? body.stats : existing.stats,
        lastSync: body.lastSync !== undefined ? body.lastSync : existing.lastSync,
        syncMsg: body.syncMsg !== undefined ? body.syncMsg : existing.syncMsg,
      };
      saveCache(updated);
      return res.json({ ok: true });
    }

    if (body.action === "save-stats") {
      existing.stats = body.stats;
      saveCache(existing);
      return res.json({ ok: true });
    }

    res.status(400).json({ error: "Unknown action" });
  } catch (err) {
    res.status(500).json({ error: "Store error", message: err.message });
  }
});

// POST /api/sync — trigger manual sync
app.post("/api/sync", async (req, res) => {
  try {
    const data = await runSync();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Sync failed", message: err.message });
  }
});

// Fallback: serve index.html for any non-API route
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// ---------- Cron: auto-sync weekly (Sunday 03:00) ----------

cron.schedule("0 3 * * 0", () => {
  console.log("[cron] Weekly auto-sync triggered");
  runSync().catch(err => console.error("[cron] Auto-sync failed:", err.message));
});

// ---------- Start ----------

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
