import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { audio, language } = await request.json();
    
    const audioBuffer = Buffer.from(audio, 'base64');
    
    const audioFile = new File([audioBuffer], 'audio.wav', { type: 'audio/wav' });
    
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en', // Always use English
    });

    return NextResponse.json({ text: transcription.text });
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { error: 'Transcription failed' },
      { status: 500 }
    );
  }
}