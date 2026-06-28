import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(req) {
  try {
    const { inventory } = await req.json();

    if (!inventory) {
      return NextResponse.json({ error: 'Inventory list is required.' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        response_mime_type: "application/json",
      }
    });

    const prompt = `You are a helpful chef. The user will provide a list of ingredients. Suggest 3 simple recipe ideas. Respond with a JSON object containing a single key "recipes" which is an array of strings. Example: {"recipes": ["Recipe 1", "Recipe 2", "Recipe 3"]}. Here are my ingredients: ${inventory}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // model already returns JSON, so pass it straight through
    return new NextResponse(text, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Error getting recipes:', error);
    return NextResponse.json({ error: 'Failed to get recipes.' }, { status: 500 });
  }
}