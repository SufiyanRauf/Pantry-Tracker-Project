import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { image } = await req.json();

    if (!image) {
      return NextResponse.json({ error: 'Image data is required.' }, { status: 400 });
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
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