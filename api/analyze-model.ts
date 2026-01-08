import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageData } = req.body;
    
    if (!imageData) {
      return res.status(400).json({ error: 'Missing imageData' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: {
        parts: [
          { 
            text: "Analyze this architectural massing model. Identify floors, balconies, structural lines, and residential/commercial usage based on color (White=Residential, Blue=Commercial). Describe the geometry, camera perspective, and proportions precisely. This is a locked geometry check." 
          },
          { 
            inlineData: { mimeType: 'image/png', data: imageData } 
          }
        ]
      }
    });

    const description = response.text || "Standard architectural massing model.";
    res.status(200).json({ description });
  } catch (error: any) {
    console.error('Analyze model error:', error);
    res.status(500).json({ error: error.message || 'Analysis failed' });
  }
}
