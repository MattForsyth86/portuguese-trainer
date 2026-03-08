const { google } = require("googleapis");

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
    const auth = new google.auth.JWT(
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      null,
      process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      ["https://www.googleapis.com/auth/documents.readonly"]
    );

    const docs = google.docs({ version: "v1", auth });
    const res = await docs.documents.get({
      documentId: process.env.GOOGLE_DOC_ID,
    });

    // Extract all text from the doc
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

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ text, charCount: text.length }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Fetch failed", message: err.message }),
    };
  }
};
