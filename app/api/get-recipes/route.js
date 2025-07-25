import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { inventory } = await req.json();

    if (!inventory) {
      return NextResponse.json({ error: 'Inventory list is required.' }, { status: 400 });
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful chef. The user will provide a list of ingredients. Suggest 3 simple recipe ideas. Respond with a JSON object containing a single key "recipes" which is an array of strings. Example: {"recipes": ["Recipe 1", "Recipe 2", "Recipe 3"]}',
        },
        {
          role: 'user',
          content: `Here are my ingredients: ${inventory}`,
        },
      ],
      response_format: { type: "json_object" },
    });
    
    // The openai library automatically parses the JSON response when using response_format.
    const recipeObject = JSON.parse(response.choices[0].message.content);
    
    return NextResponse.json(recipeObject);

  } catch (error) {
    console.error('Error getting recipes:', error);
    return NextResponse.json({ error: 'Failed to get recipes.' }, { status: 500 });
  }
}