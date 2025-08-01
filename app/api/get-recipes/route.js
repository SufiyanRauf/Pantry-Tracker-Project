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
    const { inventory } = await req.json();

    if (!inventory) {
      return NextResponse.json({ error: 'Inventory list is required.' }, { status: 400 });
    }

    // Create the API request to OpenRouter
    const response = await openai.chat.completions.create({
      model: 'google/gemma-2-9b-it:free', // Using a powerful free model for text generation
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
    
    // Parse the JSON response from the model
    const recipeObject = JSON.parse(response.choices[0].message.content);
    
    return NextResponse.json(recipeObject);

  } catch (error) {
    console.error('Error getting recipes:', error);
    return NextResponse.json({ error: 'Failed to get recipes.' }, { status: 500 });
  }
}