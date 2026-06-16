import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audio_base64, len } = await req.json();

    if (!audio_base64 || !len) {
      return new Response(
        JSON.stringify({ error: "缺少音频数据参数" }),
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

    // 调用你的语音识别 API
    // TODO: 替换为你自己的 API 网关地址
    const sttResponse = await fetch(
      "https://YOUR_API_GATEWAY/server_api",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Gateway-Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          format: "wav",
          rate: 16000,
          cuid: "korean-chat-app-001",
          speech: audio_base64,
          len: len,
        }),
      }
    );

    if (!sttResponse.ok) {
      const errorText = await sttResponse.text();
      console.error("语音识别API错误:", errorText);

      if (sttResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "请求过于频繁，请稍后再试" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (sttResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "服务余额不足" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "语音识别服务错误，请重试" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sttData = await sttResponse.json();

    // 检查API返回的错误码
    if (sttData.err_no !== 0) {
      console.error("语音识别返回错误:", sttData.err_msg);
      return new Response(
        JSON.stringify({ error: `语音识别失败: ${sttData.err_msg || "请重试"}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const text = sttData.result?.[0] || "";

    return new Response(
      JSON.stringify({ text }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("语音识别Edge Function错误:", error);
    return new Response(
      JSON.stringify({ error: "语音识别服务内部错误" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
