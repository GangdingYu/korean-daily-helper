import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MARKER_SUGGESTIONS = "💡";
const PREFIX_EN = "「Translation」";
const PREFIX_ZH = "「译」";

const FORMAT = [
  "Format:",
  "- One Korean sentence per line.",
  `- Translation on the next line. English: ${PREFIX_EN} … Chinese: ${PREFIX_ZH} …`,
  `- Dialogue: end with ${MARKER_SUGGESTIONS}, then 2–3 reply options (Korean + translation each).`,
].join("\n");

const REASONING =
  "Decide scene, relationship, register, and tone first. Do not print that reasoning—only Korean lines and translations.";

const PROMPT_EXAMPLES = [
  "Help learners with everyday Korean young people actually use.",
  "Pick 반말, 해요체, or 합쇼체 from the relationship in the scene.",
  REASONING,
  "Give exactly 3 natural Korean sentences for the user's scene, each with a translation.",
  "The three lines should differ in opening, ending, and tone—not the same frame with only the last word changed.",
  FORMAT,
  "No grammar lectures or extra commentary.",
].join("\n");

const PROMPT_DIALOGUE = [
  "Korean conversation practice partner. Stay in the scene.",
  "Friends: 반말. Strangers or service: 해요체. Workplace: 합쇼체 or polite 해요체.",
  REASONING,
  "Reply as the other person in Korean, then offer 2–3 short reply options the user could say next.",
  FORMAT,
  "No grammar lectures or extra commentary.",
].join("\n");

function getSystemPrompt(mode: string): string {
  return mode === "dialogue" ? PROMPT_DIALOGUE : PROMPT_EXAMPLES;
}

const GATEWAY_URL = Deno.env.get("CHAT_GATEWAY_URL") ?? "";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, mode } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Invalid request: messages array required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("INTEGRATIONS_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Server API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!GATEWAY_URL) {
      return new Response(
        JSON.stringify({ error: "CHAT_GATEWAY_URL not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = getSystemPrompt(mode || "examples");
    const fullMessages = [{ role: "system", content: systemPrompt }, ...messages];

    const aiResponse = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Gateway-Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ messages: fullMessages, stream: true }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("Chat gateway error:", errorText);

      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Too many requests" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Insufficient quota" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: `Gateway error: ${aiResponse.status}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(aiResponse.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("korean-chat error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
