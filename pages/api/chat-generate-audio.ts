// /pages/api/chat-generate-audio.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/lib/server';
import { generateSpeech } from '@/lib/elevenlabs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createClient(req, res);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { chatId, text, language } = req.body;

    const audioUrl = await generateSpeech(text, language);

    const { error: updateError } = await supabase
      .from('chat_messages')
      .update({ audio_url: audioUrl })
      .eq('id', chatId);

    if (updateError) {
      return res.status(500).json({ error: 'Failed to update audio URL' });
    }

    return res.status(200).json({ audioUrl });

  } catch (error) {
    console.error('Audio generation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
