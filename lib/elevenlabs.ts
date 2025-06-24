export async function generateSpeech(
  text: string,
  language: string = 'en'
): Promise<string | null> {
  try {
    // Check if API key is available
    if (!process.env.ELEVENLABS_API_KEY) {
      console.warn('ElevenLabs API key not configured');
      return null;
    }

    // Always use English voice
    const voiceId = 'EXAVITQu4vr4xnSDxMaL' // Bella - English
    
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
          style: 0.5,
          use_speaker_boost: true
        }
      }),
    })

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`ElevenLabs API error: ${response.status} - ${errorText}`);
      
      // Don't throw error, just return null to gracefully handle API failures
      return null;
    }

    const audioBuffer = await response.arrayBuffer()
    const base64Audio = Buffer.from(audioBuffer).toString('base64')
    
    return `data:audio/mpeg;base64,${base64Audio}`
  } catch (error) {
    console.error('ElevenLabs API error:', error)
    return null
  }
}

export function getFallbackAudioMessage(language: string): string {
  return "Audio is currently unavailable. Please try again later."
}