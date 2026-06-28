exports.handler = async function(event, context) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "API key not configured" })
    };
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      messages: [{
        role: "user",
        content: `Search for the latest FIFA World Cup 2026 results and return ONLY a JSON object with this exact structure, no other text:
{
  "lastUpdated": "ISO timestamp",
  "matches": [
    {
      "team1": "Team Name",
      "team2": "Team Name",
      "score1": 0,
      "score2": 0,
      "stage": "group",
      "group": "A",
      "status": "completed"
    }
  ]
}
Only include matches that have been played or are currently live.`
      }]
    })
  });

  const data = await response.json();

  const textBlock = data.content?.find(block => block.type === "text");

  if (!textBlock) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "No response from Claude", raw: data })
    };
  }

  try {
    const scoreData = JSON.parse(textBlock.text);
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify(scoreData)
    };
  } catch(e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Could not parse scores", raw: textBlock.text })
    };
  }
};
