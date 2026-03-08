const { getStore } = require("@netlify/blobs");

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
    const store = getStore({ name: "portuguese-trainer", consistency: "strong" });

    if (event.httpMethod === "GET") {
      let data = null;
      try {
        data = await store.get("app-data", { type: "json" });
      } catch (e) {
        // Key doesn't exist yet — that's fine
      }
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data || {}),
      };
    }

    if (event.httpMethod === "POST") {
      const body = JSON.parse(event.body);
      const { action } = body;

      if (action === "save") {
        let existing = {};
        try {
          existing = await store.get("app-data", { type: "json" }) || {};
        } catch (e) {}
        const updated = {
          ...existing,
          synced: body.synced !== undefined ? body.synced : existing.synced,
          stats: body.stats !== undefined ? body.stats : existing.stats,
          lastSync: body.lastSync !== undefined ? body.lastSync : existing.lastSync,
          syncMsg: body.syncMsg !== undefined ? body.syncMsg : existing.syncMsg,
        };
        await store.setJSON("app-data", updated);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ ok: true }),
        };
      }

      if (action === "save-stats") {
        let existing = {};
        try {
          existing = await store.get("app-data", { type: "json" }) || {};
        } catch (e) {}
        existing.stats = body.stats;
        await store.setJSON("app-data", existing);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ ok: true }),
        };
      }

      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Unknown action" }),
      };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Store error", message: err.message, stack: err.stack }),
    };
  }
};
