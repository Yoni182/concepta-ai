import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import { PlanningRightsObject, TamhilOutput } from '../../types';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

interface MassingAlternative {
  id: string;
  name: string;
  description: string;
  height_m: number;
  coverage_percent: number;
  setback_front_m: number;
  setback_sides_m: number;
  towers: Tower[];
  key_metrics: {
    total_floors: number;
    fsi: number;
    density_units_per_hectare: number;
  };
  design_rationale: string;
}

interface Tower {
  name: string;
  position: { x: number; y: number; z: number };
  dimensions: { width: number; depth: number; height: number };
  floors: FloorData[];
}

interface FloorData {
  floor_number: number;
  units_by_size: Record<string, number>;
}

const MASSING_PROMPT = `You are an expert Israeli architect. Generate exactly 3 building massing alternatives based on planning constraints.

**Constraints:**
- Max Units: {MAX_UNITS}
- Max Height: {HEIGHT_MAX}m
- Max Floors: {FLOORS_MAX}
- Main Area: {MAIN_AREA} sqm

**Return ONLY this JSON array structure with exactly 3 objects:**

\`\`\`json
[
  {
    "id": "A",
    "name": "Compact Tower",
    "description": "Maximizes height and density in compact footprint",
    "height_m": 45,
    "coverage_percent": 35,
    "setback_front_m": 8,
    "setback_sides_m": 5,
    "towers": [
      {
        "name": "Tower 1",
        "position": {"x": 0, "y": 0, "z": 0},
        "dimensions": {"width": 40, "depth": 30, "height": 45},
        "floors": [{"floor_number": 1, "units_by_size": {"81": 4, "109": 4}}]
      }
    ],
    "key_metrics": {
      "total_floors": 15,
      "fsi": 2.5,
      "density_units_per_hectare": 180
    },
    "design_rationale": "Single tower strategy maximizing height"
  },
  {
    "id": "B",
    "name": "Balanced Form",
    "description": "Balanced height and coverage approach",
    "height_m": 40,
    "coverage_percent": 45,
    "setback_front_m": 10,
    "setback_sides_m": 6,
    "towers": [
      {
        "name": "Tower 1",
        "position": {"x": 0, "y": 0, "z": 0},
        "dimensions": {"width": 50, "depth": 35, "height": 40},
        "floors": [{"floor_number": 1, "units_by_size": {"81": 5, "109": 5}}]
      }
    ],
    "key_metrics": {
      "total_floors": 13,
      "fsi": 2.1,
      "density_units_per_hectare": 160
    },
    "design_rationale": "Balanced two-tower approach with good site integration"
  },
  {
    "id": "C",
    "name": "Articulated Spread",
    "description": "Lower height with wider footprint and articulation",
    "height_m": 35,
    "coverage_percent": 55,
    "setback_front_m": 12,
    "setback_sides_m": 8,
    "towers": [
      {
        "name": "Tower 1",
        "position": {"x": 0, "y": 0, "z": 0},
        "dimensions": {"width": 60, "depth": 40, "height": 35},
        "floors": [{"floor_number": 1, "units_by_size": {"81": 6, "109": 6}}]
      }
    ],
    "key_metrics": {
      "total_floors": 11,
      "fsi": 1.8,
      "density_units_per_hectare": 140
    },
    "design_rationale": "Spread form maximizes coverage and outdoor spaces"
  }
]
\`\`\``;

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
    console.error('GEMINI_API_KEY not set');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const { planningRights, tamhil } = req.body as {
      planningRights: PlanningRightsObject;
      tamhil: TamhilOutput;
    };

    if (!planningRights || !tamhil) {
      return res.status(400).json({ error: 'Missing planning rights or tamhil data' });
    }

    console.log('[Massing] Generating alternatives...');

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    // Build prompt with actual values
    const prompt = MASSING_PROMPT
      .replace('{MAX_UNITS}', String(planningRights.rights.max_units))
      .replace('{HEIGHT_MAX}', String(planningRights.rights.height_max_m))
      .replace('{FLOORS_MAX}', String(planningRights.rights.floors_max))
      .replace('{MAIN_AREA}', String(planningRights.rights.main_area_sqm));

    // Call Gemini
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: { parts: [{ text: prompt }] },
    });

    const responseText = response.text || '';
    console.log('[Massing] Response received');

    // Extract and parse JSON
    let alternatives: MassingAlternative[];
    try {
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : responseText;
      alternatives = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('[Massing] Parse error:', responseText.substring(0, 300));
      return res.status(500).json({
        error: 'Failed to parse massing alternatives',
        raw: responseText.substring(0, 500),
      });
    }

    if (!Array.isArray(alternatives) || alternatives.length === 0) {
      throw new Error('Invalid alternatives format');
    }

    console.log(`[Massing] Generated ${alternatives.length} alternatives`);

    return res.status(200).json({
      massingAlternatives: alternatives,
      generatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Massing] Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
