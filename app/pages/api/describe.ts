// import { NextRequest, NextResponse } from "next/server";
// import { analyzeArtwork } from "@/lib/openai";
// import { generateSpeech } from "@/lib/elevenlabs";
// import { analyzeImageSchema } from "@/lib/validation";
// import { createClient } from "@/lib/server";

// export async function POST(request: NextRequest) {
//   try {
//     const supabase = createClient();

//     const {
//       data: { user },
//       error,
//     } = await supabase.auth.getUser();

//     if (!user || error) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     console.log("auth.uid()", user.id);

//     const body = await request.json();
//     const validated = analyzeImageSchema.parse(body);
//     const { image, location, language } = validated;

//     const { title, description } = await analyzeArtwork(
//       image,
//       location,
//       language
//     );
//     console.log("Title:", title);
//     console.log("Description:", description);

//     let audioUrl: string | null = null;
//     try {
//       audioUrl = await generateSpeech(description, language);
//     } catch (err) {
//       console.error("Audio generation failed:", err);
//     }

//     const imageBuffer = Buffer.from(image, "base64");
//     const fileName = `${user.id}/${Date.now()}.jpg`;

//     const { error: uploadError } = await supabase.storage
//       .from("artworks")
//       .upload(fileName, imageBuffer, {
//         contentType: "image/jpeg",
//         upsert: false,
//       });

//     if (uploadError) {
//       console.error("Image upload error:", uploadError);
//       return NextResponse.json({ error: "Upload failed" }, { status: 500 });
//     }

//     const {
//       data: { publicUrl },
//     } = supabase.storage.from("artworks").getPublicUrl(fileName);
//     console.log("📦 Insertando en scans con payload:", {
//       user_id: user.id,
//       image_url: publicUrl,
//       title,
//       description,
//       audio_url: audioUrl,
//       location,
//       language,
//     });

//     const { data: scan, error: dbError } = await supabase
//       .from("scans")
//       .insert({
//         user_id: user.id,
//         image_url: publicUrl,
//         title,
//         description,
//         audio_url: audioUrl,
//         location,
//         language,
//       })
//       .select()
//       .single();

//     if (dbError) {
//       console.error("Database error:", dbError);
//       return NextResponse.json({ error: "DB error" }, { status: 500 });
//     }

//     return NextResponse.json({
//       scanId: scan.id,
//       title,
//       description,
//       audioUrl,
//       imageUrl: publicUrl,
//     });
//   } catch (error) {
//     console.error("API error:", error);
//     return NextResponse.json(
//       { error: "Internal Server Error" },
//       { status: 500 }
//     );
//   }
// }

import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/lib/server';
import { analyzeArtwork } from '@/lib/openai';
import { generateSpeech } from '@/lib/elevenlabs';
import { analyzeImageSchema } from '@/lib/validation';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createClient(req, res);
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (!user || error) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const validated = analyzeImageSchema.parse(req.body);
    const { image, location, language } = validated;

    const { title, description } = await analyzeArtwork(image, location, language);

    let audioUrl: string | null = null;
    try {
      audioUrl = await generateSpeech(description, language);
    } catch (err) {
      console.error('Audio generation failed:', err);
    }

    const imageBuffer = Buffer.from(image, 'base64');
    const fileName = `${user.id}/${Date.now()}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from('artworks')
      .upload(fileName, imageBuffer, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (uploadError) {
      console.error('Image upload error:', uploadError);
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
        audio_url: audioUrl,
        location,
        language,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return res.status(500).json({ error: 'DB error' });
    }

    return res.status(200).json({
      scanId: scan.id,
      title,
      description,
      audioUrl,
      imageUrl: publicUrl,
    });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
