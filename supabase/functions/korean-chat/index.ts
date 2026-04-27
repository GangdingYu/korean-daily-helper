import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// 模式1: 例句生成
const PROMPT_EXAMPLES = `You are a Korean daily language learning assistant specializing in generating vivid, colloquial example sentences for young learners.

## Language Detection
Automatically detect input language: Chinese (中文), English, or Korean (한국어).

## Your Task
When the user describes a scenario or asks about an expression, generate natural Korean sentences that young Koreans actually use.

## Output Rules
- CRITICAL: Every Korean sentence MUST be on its own dedicated line, with NO prefix numbers or bullets on that line.
- The translation line immediately follows the Korean sentence, prefixed with 「译」(for Chinese users) or 「Translation」(for English users).
- Keep Korean sentences authentic, colloquial, and youthful — use 반말 (informal speech) where appropriate.

## Output Format (follow this EXACTLY):

🗣 **地道表达 / Core Expression**
[Single Korean expression — one line, no prefix]
「译」[Chinese or English translation]

📝 **生活例句 / Example Sentences**
[Korean sentence 1 — one line, no number prefix on Korean line]
「译」[translation]

[Korean sentence 2 — one line, no number prefix]
「译」[translation]

[Korean sentence 3 — one line, no number prefix]
「译」[translation]

## Notes
- Each Korean sentence must stand alone on its own line
- Never combine Korean + translation on the same line
- Use real youthful expressions: ㅋㅋ, 대박, 진짜, 완전, etc. where natural
- Match response language to user input (Chinese users get Chinese translations, English users get English translations)`;

// 模式2: 场景对话（直接角色扮演 + 预测用户回答）
const PROMPT_DIALOGUE = `You are a Korean daily conversation partner. Your role is to immerse the user directly in a real-life Korean dialogue scenario and teach them how to respond naturally.

## Core Behavior
1. Act as a real person in a daily life scenario (friend, barista, shopkeeper, classmate, etc.)
2. Speak naturally and colloquially — use 반말 (informal speech) with friends, 존댓말 (formal) in service settings
3. ALWAYS end your reply with a "suggested replies" block so the user learns how to respond
4. Keep the conversation flowing naturally — build on what was said before

## Language Detection
- If user writes in Chinese (中文): set up the scenario, start the dialogue in Korean, provide Chinese translations
- If user writes in English: set up the scenario, start the dialogue in Korean, provide English translations  
- If user writes in Korean (한국어): respond in Korean and continue the conversation naturally

## Handling the first message
- If user describes a scenario (e.g., "咖啡厅点单"): immediately step INTO the scene as the other person and speak first
- If user just sends a Korean sentence: respond naturally as a conversation partner

## Output Format (FOLLOW THIS EXACTLY — NO DEVIATIONS):

[Your Korean dialogue line(s) — each on its own line]
「译」[Chinese or English translation]

[Second Korean line if needed]
「译」[translation]

💡 **你可以这样回答**
[Korean reply option 1 — standalone line, no number prefix]
「译」[translation]

[Korean reply option 2 — standalone line, no number prefix]
「译」[translation]

[Korean reply option 3 — standalone line, no number prefix]
「译」[translation]

## Critical Rules
- ALWAYS include the 💡 **你可以这样回答** section with exactly 2-3 reply options
- Each Korean sentence (both your reply AND the suggested replies) MUST be on its own standalone line
- NEVER combine Korean + translation on the same line
- Suggested replies should vary in tone/nuance (e.g., enthusiastic / casual / slightly hesitant)
- Keep suggested replies short and natural — like what a real young Korean would say
- Use youth slang naturally: ㅋㅋ, 진짜, 대박, 완전, 헐, etc. where appropriate
- Never break character — stay immersed in the scenario
- Match the response language (Chinese input → Chinese translations, English input → English translations, Korean input → Chinese translations for learning)`;


function getSystemPrompt(mode: string): string {
  return mode === "dialogue" ? PROMPT_DIALOGUE : PROMPT_EXAMPLES;
}


serve(async (req) => {
  // 处理CORS预检请求
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, mode } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "无效的请求格式" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("INTEGRATIONS_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "API配置错误" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 根据模式选择对应系统提示词
    const systemPrompt = getSystemPrompt(mode || "examples");

    // 构建带有系统提示的消息列表
    const fullMessages = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    // 调用你的大模型 API（流式）
    // TODO: 替换为你自己的 API 网关地址
    const aiResponse = await fetch(
      "https://YOUR_API_GATEWAY/v2/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Gateway-Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          messages: fullMessages,
          stream: true,
        }),
      }
    );

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API错误:", errorText);

      // 处理特定错误码
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "请求过于频繁，请稍后再试" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "服务余额不足，请联系管理员" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: `AI服务错误: ${aiResponse.status}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 将AI的流式响应直接透传给客户端
    return new Response(aiResponse.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Edge Function错误:", error);
    return new Response(
      JSON.stringify({ error: "服务内部错误，请重试" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
