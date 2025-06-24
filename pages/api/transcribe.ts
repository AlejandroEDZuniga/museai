// import { NextRequest, NextResponse } from 'next/server';
// import OpenAI from 'openai';

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// export async function POST(request: NextRequest) {
//   try {
//     const { audio, language } = await request.json();
    
//     const audioBuffer = Buffer.from(audio, 'base64');
    
//     const audioFile = new File([audioBuffer], 'audio.wav', { type: 'audio/wav' });
    
//     const transcription = await openai.audio.transcriptions.create({
//       file: audioFile,
//       model: 'whisper-1',
//       language: 'en', // Always use English
//     });

//     return NextResponse.json({ text: transcription.text });
//   } catch (error) {
//     console.error('Transcription error:', error);
//     return NextResponse.json(
//       { error: 'Transcription failed' },
//       { status: 500 }
//     );
//   }
// }


import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { Readable } from 'stream';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // ajusta si los audios son grandes
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { audio, language } = req.body;

    if (!audio) {
      return res.status(400).json({ error: 'Audio is required' });
    }

    const audioBuffer = Buffer.from(audio, 'base64');

    // Convertir el buffer a un objeto File-like compatible
    const audioFile = new File([audioBuffer], 'audio.wav', { type: 'audio/wav' });

    // Llamar a la API de OpenAI con el archivo como File
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: language || 'en',
    });

    return res.status(200).json({ text: transcription.text });
  } catch (error: any) {
    console.error('Transcription error:', error);
    return res.status(500).json({ error: 'Transcription failed' });
  }
}
