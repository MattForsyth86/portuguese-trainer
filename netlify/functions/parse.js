const Anthropic = require("@anthropic-ai/sdk").default;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function recoverJSON(text) {
  let clean = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  try { return JSON.parse(clean); } catch(e) {}
  if (clean.startsWith("[")) {
    const last = clean.lastIndexOf("},");
    if (last > 0) try { return JSON.parse(clean.substring(0, last + 1) + "]"); } catch(e) {}
    const lastB = clean.lastIndexOf("}");
    if (lastB > 0) try { return JSON.parse(clean.substring(0, lastB + 1) + "]"); } catch(e) {}
  }
  if (clean.startsWith("{")) {
    const lastArr = clean.lastIndexOf("]");
    if (lastArr > 0) try { return JSON.parse(clean.substring(0, lastArr + 1) + "}"); } catch(e) {}
  }
  throw new Error("Could not parse JSON response");
}

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  try {
    const { text, section } = JSON.parse(event.body);
    if (!text || !section) throw new Error("Missing text or section");

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
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const responseText = response.content[0]?.text || "";
    const data = recoverJSON(responseText);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ data, section }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Parse failed", message: err.message }),
    };
  }
};
