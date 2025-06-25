import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/lib/server';
import { chatWithAI } from '@/lib/openai';
import { chatMessageSchema } from '@/lib/validation';
import { ZodError } from 'zod';

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

    const validatedData = chatMessageSchema.parse(req.body);
    const { scanId, message, language } = validatedData;

    const { data: scanData, error: scanError } = await supabase
      .from('scans')
      .select('*')
      .eq('id', scanId)
      .eq('user_id', user.id)
      .single();

    if (scanError || !scanData) {
      return res.status(404).json({ error: 'Scan not found' });
    }

    const context = `Title: ${scanData.title}\nDescription: ${scanData.description}`;
    const response = await chatWithAI(message, context, language);

    const { data: chatData, error: chatError } = await supabase
      .from('chat_messages')
      .insert({
        scan_id: scanId,
        user_id: user.id,
        message,
        response,
        audio_url: null,
      })
      .select()
      .single();

    if (chatError) {
      return res.status(500).json({ error: 'Failed to save chat' });
    }

    return res.status(200).json({
      id: chatData.id,
      message,
      response,
      createdAt: chatData.created_at,
    });

  } catch (error) {
    console.error('Chat API error:', error);
    if (error instanceof ZodError) {
      return res.status(400).json({ error: error.flatten() });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
}
