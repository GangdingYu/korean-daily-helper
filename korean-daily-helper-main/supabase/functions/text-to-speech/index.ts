import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const TTS_GATEWAY_URL = Deno.env.get("TTS_GATEWAY_URL") ?? "";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();

    if (!text || typeof text !== "string" || text.trim() === "") {
      return new Response(
        JSON.stringify({ error: "文本内容不能为空" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 限制文本长度
    const truncatedText = text.trim().slice(0, 2000);

    const apiKey = Deno.env.get("INTEGRATIONS_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "API配置错误" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!TTS_GATEWAY_URL) {
      return new Response(
        JSON.stringify({ error: "TTS_GATEWAY_URL not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call your TTS gateway
    const ttsResponse = await fetch(
      TTS_GATEWAY_URL,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Gateway-Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "speech-2.8-hd",
          text: truncatedText,
          stream: false,
          voice_setting: {
            voice_id: "female-shaonv",
            speed: 0.95,
            vol: 1.0,
            pitch: 0,
          },
          audio_setting: {
            sample_rate: 32000,
            bitrate: 128000,
            format: "mp3",
            channel: 1,
          },
          language_boost: "auto",
          output_format: "hex",
        }),
      }
    );

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      console.error("TTS API错误:", errorText);

      if (ttsResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "请求过于频繁，请稍后再试" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (ttsResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "服务余额不足" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "语音合成服务错误，请重试" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ttsData = await ttsResponse.json();

    // 检查API返回状态
    if (ttsData.base_resp?.status_code !== 0) {
      console.error("TTS API返回错误:", ttsData.base_resp);
      return new Response(
        JSON.stringify({ error: `语音合成失败: ${ttsData.base_resp?.status_msg || "请重试"}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const audioHex = ttsData.data?.audio;
    if (!audioHex) {
      return new Response(
        JSON.stringify({ error: "语音合成未返回音频数据" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ audio_hex: audioHex }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("TTS Edge Function错误:", error);
    return new Response(
      JSON.stringify({ error: "语音合成服务内部错误" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
