export default async (req, context) => {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "API key not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
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
      "stage": "group|r32|r16|qf|sf|final",
      "group": "A",
      "status": "completed|live|upcoming"
    }
  ]
}
Only include matches that have been played or are currently live.`
      }]
    })
  });

  const data = await response.json();
  
  // Extract the text response from Claude
  const textBlock = data.content?.find(block => block.type === "text");
  
  if (!textBlock) {
    return new Response(JSON.stringify({ error: "No response from Claude" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Parse Claude's JSON response
  try {
    const scoreData = JSON.parse(textBlock.text);
    return new Response(JSON.stringify(scoreData), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({ 
      error: "Could not parse scores", 
      raw: textBlock.text 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

export const config = { path: "/api/scores" };
