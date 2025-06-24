import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/server';
import { chatWithAI } from '@/lib/openai';
import { generateSpeech } from '@/lib/elevenlabs';
import { chatMessageSchema } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = chatMessageSchema.parse(body);
    const { scanId, message, language } = validatedData;

    const { data: scanData, error: scanError } = await supabase
      .from('scans')
      .select('*')
      .eq('id', scanId)
      .eq('user_id', user.id)
      .single();

    if (scanError || !scanData) {
      return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
    }

    const context = `Title: ${scanData.title}\nDescription: ${scanData.description}`;

    const response = await chatWithAI(message, context, language);

    // Generate audio with improved error handling
    let audioUrl: string | null = null;
    try {
      audioUrl = await generateSpeech(response, language);
      if (!audioUrl) {
        console.log('Audio generation skipped - service unavailable');
      }
    } catch (error) {
      console.error('Audio generation failed:', error);
      // Continue without audio - don't let audio failure break the chat
    }

    const { data: chatData, error: chatError } = await supabase
      .from('chat_messages')
      .insert({
        scan_id: scanId,
        user_id: user.id,
        message,
        response,
        audio_url: audioUrl,
      })
      .select()
      .single();

    if (chatError) {
      console.error('Chat save error:', chatError);
      return NextResponse.json({ error: 'Failed to save chat' }, { status: 500 });
    }

    return NextResponse.json({
      id: chatData.id,
      message,
      response,
      audioUrl,
      createdAt: chatData.created_at,
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}