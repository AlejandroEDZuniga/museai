import type { NextApiRequest, NextApiResponse } from 'next';
import { analyzeArtwork } from '@/lib/openai';
import { analyzeImageSchema } from '@/lib/validation';
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

    const body = req.body;
    const validated = analyzeImageSchema.parse(body);
    const { image, location, language } = validated;

    const { title, description } = await analyzeArtwork(image, location, language);

    const imageBuffer = Buffer.from(image, 'base64');
    const fileName = `${user.id}/${Date.now()}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from('artworks')
      .upload(fileName, imageBuffer, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (uploadError) {
      return res.status(500).json({ error: 'Upload failed' });
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('artworks').getPublicUrl(fileName);

    const { data: scan, error: dbError } = await supabase
      .from('scans')
      .insert({
        user_id: user.id,
        image_url: publicUrl,
        title,
        description,
        audio_url: null,
        location,
        language,
      })
      .select()
      .single();

    if (dbError) {
      return res.status(500).json({ error: 'Database insert failed' });
    }

    return res.status(200).json({
      scanId: scan.id,
      title,
      description,
      imageUrl: publicUrl,
    });

  } catch (error) {
    console.error('Describe API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
