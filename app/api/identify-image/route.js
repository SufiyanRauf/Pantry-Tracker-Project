import OpenAI from 'openai';
import { NextResponse } from 'next/server';

// Configure the OpenAI client to use the OpenRouter API
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "https://pantry-tracker-project-seven.vercel.app/",
    "X-Title": "Pantry Tracker Project", // Optional: A name for your app
  },
});

export async function POST(req) {
  try {
    const { image } = await req.json();

    if (!image) {
      return NextResponse.json({ error: 'Image data is required.' }, { status: 400 });
    }

    // Create the API request to OpenRouter with the corrected model name
    const response = await openai.chat.completions.create({
      model: 'nousresearch/nous-hermes-2-vision-7b', // Corrected to a compatible free model
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'What is the single main food item in this image? Respond with only the name of the food item in lowercase. For example: "apple" or "banana".' },
            {
              type: 'image_url',
              image_url: {
                url: image,
              },
            },
          ],
        },
      ],
      max_tokens: 30,
    });
    
    const itemName = response.choices[0].message.content;
    return NextResponse.json({ item: itemName });

  } catch (error) {
    console.error('Error identifying image:', error);
    return NextResponse.json({ error: 'Failed to identify image.' }, { status: 500 });
  }
}