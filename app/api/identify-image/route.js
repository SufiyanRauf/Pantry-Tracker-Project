import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from 'next/server';

// Initialize the Google AI client with your API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Function to convert a data URL to a GoogleGenerativeAI.Part object
function fileToGenerativePart(dataUrl) {
  // Expected format: "data:image/jpeg;base64,..."
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid data URL format');
  }
  return {
    inlineData: {
      data: match[2],
      mimeType: match[1],
    },
  };
}

export async function POST(req) {
  try {
    const { image } = await req.json();

    if (!image) {
      return NextResponse.json({ error: 'Image data is required.' }, { status: 400 });
    }

    // Get the generative model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = 'What is the single main food item in this image? Respond with only the name of the food item in lowercase. For example: "apple" or "banana".';
    
    const imagePart = fileToGenerativePart(image);

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    // Clean up the response to remove any potential markdown or extra spaces
    const itemName = text.trim().replace(/`/g, '');

    return NextResponse.json({ item: itemName });

  } catch (error) {
    console.error('Error identifying image:', error);
    return NextResponse.json({ error: 'Failed to identify image.' }, { status: 500 });
  }
}