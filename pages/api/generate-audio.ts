import type { NextApiRequest, NextApiResponse } from 'next';
import { generateSpeech } from '@/lib/elevenlabs';
import { createClient } from '@/lib/server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createClient(req, res);
    const { data: { user }, error } = await supabase.auth.getUser();

    if (!user || error) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { scanId, description, language } = req.body;

    const audioUrl = await generateSpeech(description, language);

    const { error: updateError } = await supabase
      .from('scans')
      .update({ audio_url: audioUrl })
      .eq('id', scanId);

    if (updateError) {
      return res.status(500).json({ error: 'Failed to update audio URL' });
    }

    return res.status(200).json({ audioUrl });
  } catch (error) {
    console.error('Audio generation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
