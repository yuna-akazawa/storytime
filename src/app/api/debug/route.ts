// Debug endpoint to check environment variables
export async function GET() {
  return new Response(JSON.stringify({
    hasElevenLabsKey: !!process.env.ELEVENLABS_API_KEY,
    elevenLabsKeyLength: process.env.ELEVENLABS_API_KEY ? process.env.ELEVENLABS_API_KEY.length : 0,
    voiceId: process.env.ELEVENLABS_VOICE_ID || "not set",
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  }, null, 2), {
    headers: {
      "Content-Type": "application/json"
    }
  });
}
