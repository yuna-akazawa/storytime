// src/app/api/tts/route.ts
// Proxies ElevenLabs streaming TTS so the API key stays server-side.

export async function GET(request: Request) {
  const url = new URL(request.url);
  const text = url.searchParams.get("text") || "";
  // Use Clara's voice consistently across the entire app
  const envVoice = process.env.ELEVENLABS_VOICE_ID;
  const voiceId = url.searchParams.get("voiceId") || envVoice || "2OEeJcYw2f3bWMzzjVMU"; // Clara's voice
  // Fixed voice settings for consistent speech across all pages
  const modelId = url.searchParams.get("modelId") || "eleven_multilingual_v2";

  if (!text) {
    return new Response("Missing `text`", { status: 400 });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return new Response("Server misconfigured: ELEVENLABS_API_KEY is missing", { status: 500 });
  }

  // Check if client wants word-level timing data
  const includeAlignment = url.searchParams.get("alignment") === "true";
  
  const elevenUrl = includeAlignment 
    ? `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps`
    : `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream?optimize_streaming_latency=4&output_format=mp3_44100_128`;

  const upstream = await fetch(elevenUrl, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: modelId,
      // Voice tuning for consistent, child-friendly delivery
      // Note: ElevenLabs doesn't have a direct speaking_rate parameter
      // Speed consistency is handled client-side via playbackRate
      voice_settings: {
        stability: 0.5,        // Consistent stability for predictable speech
        similarity_boost: 0.8, // Good voice consistency
        style: 0.3,           // Moderate style for natural but consistent speech
        use_speaker_boost: false,
      },
    }),
  });

  if (!upstream.ok || !upstream.body) {
    const errText = await upstream.text().catch(() => "TTS upstream error");
    console.error(`ElevenLabs API error (${upstream.status}):`, errText);
    return new Response(errText || "TTS request failed", { status: upstream.status || 502 });
  }

  if (includeAlignment) {
    // For alignment requests, parse JSON response and return word-level timing data
    const alignmentData = await upstream.json();
    return new Response(JSON.stringify(alignmentData), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  } else {
    // For regular requests, stream audio directly
    return new Response(upstream.body, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  }
}


