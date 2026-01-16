import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import { DesignDNA } from '../../types';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const { referenceImageBase64 } = req.body;

    if (!referenceImageBase64) {
      return res.status(400).json({ error: 'Missing reference image' });
    }

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    const prompt = `You are an expert architectural analyst. Analyze this reference building image and extract its complete design DNA.

ANALYZE AND EXTRACT:
1. Architectural Style - (e.g., Modern, Classical, Brutalist, Minimalist, Parametric, etc.)
2. Facade Language - Describe the overall facade composition and organization
3. Material Palette - List the primary materials visible (concrete, glass, brick, metal, stone, wood, etc.)
4. Color Scheme - Primary color, secondary colors, accent color (hex codes if possible)
5. Proportional Logic - Describe the mathematical relationships and rhythms
6. Fenestration Pattern - Window/opening organization and sizing
7. Vertical Rhythm - How vertical elements are organized
8. Horizontal Banding - How horizontal elements are organized
9. Surface Articulation - Depth, texture, relief, and articulation details
10. Human Scale Elements - Ground floor activation, entries, signage, pedestrian features

RETURN ONLY THIS JSON (no other text):
{
  "architectural_style": "...",
  "facade_language": "...",
  "material_palette": ["...", "...", "..."],
  "color_scheme": {
    "primary": "#HEXCODE",
    "secondary": ["#HEXCODE", "#HEXCODE"],
    "accent": "#HEXCODE"
  },
  "proportional_logic": "...",
  "fenestration_pattern": "...",
  "vertical_rhythm": "...",
  "horizontal_banding": "...",
  "surface_articulation": "...",
  "human_scale_elements": "..."
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: {
        parts: [
          { text: prompt },
          { inlineData: { mimeType: 'image/jpeg', data: referenceImageBase64 } }
        ]
      }
    });

    const responseText = response.text || '';

    let designDNA: DesignDNA;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : responseText;
      designDNA = JSON.parse(jsonStr);
    } catch (parseError) {
      return res.status(500).json({
        error: 'Failed to parse design analysis'
      });
    }

    return res.status(200).json({
      designDNA,
      analyzedAt: new Date().toISOString()
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Analysis failed' });
  }
}
