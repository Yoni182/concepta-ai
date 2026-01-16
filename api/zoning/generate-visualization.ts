import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import { DesignDNA, MassingAlternative, StyledMassing } from '../../types';

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
    const { massing, designDNA, referenceImageBase64 } = req.body;

    if (!massing || !designDNA) {
      return res.status(400).json({ error: 'Missing massing or design DNA' });
    }

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    const prompt = `You are an expert architect creating a detailed design system for applying an architectural style to a building massing.

MASSING DATA:
- Name: ${massing.name}
- Description: ${massing.description}
- Height: ${massing.height_m}m
- Coverage: ${massing.coverage_percent}%
- Floors: ${massing.key_metrics.total_floors}
- Number of Towers: ${massing.towers.length}

REFERENCE DESIGN DNA:
- Architectural Style: ${designDNA.architectural_style}
- Facade Language: ${designDNA.facade_language}
- Material Palette: ${designDNA.material_palette.join(', ')}
- Primary Color: ${designDNA.color_scheme.primary}
- Fenestration Pattern: ${designDNA.fenestration_pattern}
- Surface Articulation: ${designDNA.surface_articulation}

TASK: Create a detailed styling guide for applying the reference architectural style to this massing. Specify:
1. Primary Material: Main exterior material with color
2. Secondary Materials: Additional materials with colors and area percentages
3. Accent Color: For details and highlights
4. Design Description: How the reference style is applied to this specific massing

RETURN ONLY THIS JSON (no other text):
{
  "primary_material": {
    "name": "...",
    "color": "#HEXCODE",
    "texture": "..."
  },
  "secondary_materials": [
    {
      "name": "...",
      "color": "#HEXCODE",
      "texture": "...",
      "area_percent": 25
    }
  ],
  "accent_color": "#HEXCODE",
  "design_description": "..."
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: {
        parts: [
          { text: prompt },
          ...(referenceImageBase64 ? [{ inlineData: { mimeType: 'image/jpeg', data: referenceImageBase64 } }] : [])
        ]
      }
    });

    const responseText = response.text || '';

    let styledMaterialsData: any;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : responseText;
      styledMaterialsData = JSON.parse(jsonStr);
    } catch (parseError) {
      return res.status(500).json({
        error: 'Failed to parse styling data'
      });
    }

    const styledMassing: StyledMassing = {
      id: massing.id,
      reference_image_base64: referenceImageBase64 || '',
      design_dna: designDNA,
      massing_geometry: massing,
      styled_materials: {
        primary_material: styledMaterialsData.primary_material,
        secondary_materials: styledMaterialsData.secondary_materials || [],
        accent_color: styledMaterialsData.accent_color
      },
      design_description: styledMaterialsData.design_description,
      generated_at: new Date().toISOString()
    };

    return res.status(200).json({
      styledMassing,
      generatedAt: new Date().toISOString()
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Visualization generation failed' });
  }
}
