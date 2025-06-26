import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

export async function analyzeArtwork(
  imageBase64: string,
  location?: string,
  language: string = 'en'
): Promise<{ title: string; description: string }> {
  try {

    const systemPrompt = `
    You are an expert art historian and museum guide. Analyze the artwork in the image and respond with:
    Title: <title>
    Description: <very short summary, maximum 3–4 sentences, and under 450 characters. Include key historical facts and visual details. Use concise, clear, and elegant language.>${location ? ` The user is currently at: ${location}. Consider this context if relevant.`     : ''}`.trim();


    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze this artwork and return a short summary. Include key historical facts and the most notable visual highlights. Keep it under 5 sentences.',
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
                detail: 'high',
              },
            },
          ],
        },
      ],
      max_tokens: 700,
      temperature: 0.5,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    console.log('🧠 OpenAI raw response:\n', content)

    let title = 'Artwork Analysis'
    let description = "We're unable to analyze this artwork at the moment. Please try again later or contact support for assistance."

    const titleMatch = content.match(/title:\s*(.*)/i)
    const descriptionMatch = content.match(/description:\s*([\s\S]*)/i)

    if (titleMatch) {
      title = titleMatch[1].trim()
      console.log('✅ Title extracted:', title)
    }

    if (descriptionMatch) {
      description = descriptionMatch[1].trim()
      console.log('✅ Description extracted:', description)
    }

    if (!description || description.length < 30) {
      console.warn('⚠️ No structured description extracted, using full text as fallback.')
      description = content
    }

    return { title, description }
  } catch (error) {
    console.error('❌ OpenAI API error:', error)
    return {
      title: 'Artwork Analysis',
      description: "We're unable to analyze this artwork at the moment. Please try again later or contact support for assistance.",
    }
  }
}

export async function chatWithAI(
  message: string,
  context: string,
  language: string = 'en'
): Promise<string> {
  try {
    const shortContext = context.slice(0, 1500);

    const systemPrompt = `
You are an expert art historian and museum guide.
Answer user questions about artworks using the provided context.
Respond with:
- Maximum 3 sentences
- Under 450 characters
- Clear, elegant, and natural language
- Suitable for spoken narration (avoid complex or technical vocabulary)
`.trim();

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: `Context:\n${shortContext}\n\nQuestion:\n${message}`,
        },
      ],
      max_tokens: 350,
      temperature: 0.6,
    });

    const content = response.choices[0]?.message?.content?.trim() || '';

    return content || "I'm sorry, I couldn't generate a response at the moment.";
  } catch (error) {
    console.error('OpenAI Chat API error:', error);
    return "I'm sorry, I couldn't generate a response at the moment.";
  }
}
