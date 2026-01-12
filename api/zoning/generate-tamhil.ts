import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

interface PlanningRightsInput {
  parcel: {
    gush: string;
    helka: string;
    area_net_sqm: number;
  };
  zoning: {
    primary_use: string;
    plan_number?: string;
  };
  rights: {
    max_units: number;
    main_area_sqm: number;
    service_area_sqm: number;
    balcony_area_sqm?: number;
    floors_max: number;
    floors_below_ground?: number;
    height_max_m: number;
  };
  constraints: {
    parking_ratio: string;
    parking_spaces?: number;
  };
}

const TAMHIL_GENERATION_PROMPT = `You are an expert Israeli architect. Generate a complete floor-by-floor unit plan (Tamhil) from planning rights.

**Planning Rights:**
{PLANNING_RIGHTS}

**ABSOLUTE CONSTRAINTS:**
- Total units = EXACTLY {MAX_UNITS}
- Total area = EXACTLY {MAIN_AREA_SQM} sqm (±2%)
- Floors = {FLOORS_MAX}

**Unit Types:**
- n3: 81 sqm
- n4: 109-115 sqm  
- n5: 135-145 sqm
- mini_ph: 154 sqm
- ph: 180 sqm

**FOR 150 UNITS - EXACT DISTRIBUTION (matches real architect Tamhil):**

The unit mix MUST be:
- n3: 31 units (21%)
- n4: 63 units (42%)
- n5: 52 units (35%)
- mini_ph: 1 unit (1%)
- ph: 3 units (2%)
TOTAL: 31+63+52+1+3 = 150 ✓

**Floor distribution to achieve this:**
Floor 0: 0 units (ground - commercial/lobby)
Floor 1: 8 units → n4(109)×1, n4(115)×1, n3(81)×2 per tower + club
Floors 2-8: 12 units/floor × 7 floors = 84 units → mostly n4 with some n3
Floors 9-15: 8 units/floor × 7 floors = 56 units → n5 only  
Floor 16: 2 units → mix of n5/mini_ph/ph (adjust to hit targets)

**Exact counts to generate:**
- n3 (81 sqm): Generate exactly 31 units across floors 1-8
- n4 (109-115 sqm): Generate exactly 63 units across floors 1-8  
- n5 (135-145 sqm): Generate exactly 52 units across floors 9-16
- mini_ph (154 sqm): Generate exactly 1 unit on floor 15 or 16
- ph (180 sqm): Generate exactly 3 units on floor 16

**GENERATE ALL FLOORS EXPLICITLY in floor_plans array. Each floor MUST list every unit.**

**CRITICAL: unit_mix_summary MUST match floor_plans exactly. Calculate unit_mix_summary BY COUNTING floor_plans units.**

**Return JSON with ALL floors explicitly listed:**

\`\`\`json
{
  "project_info": {
    "gush": "string",
    "helka": "string", 
    "plan_number": "string or null"
  },
  "building_summary": {
    "num_buildings": 2,
    "total_floors": 17,
    "floors_below_ground": 0,
    "floors_above_ground": 17,
    "total_units": {MAX_UNITS},
    "total_main_area_sqm": {MAIN_AREA_SQM},
    "average_unit_size_sqm": 98
  },
  "floor_plans": [
    {"floor_number": 0, "floor_type": "ground", "floor_label": "קומת קרקע", "units": [], "total_units": 0},
    {"floor_number": 1, "floor_type": "typical", "floor_label": "קומה 1", "units": [
      {"unit_type": "n4", "area_sqm": 109, "count": 2, "color": "#FFD54F"},
      {"unit_type": "n4", "area_sqm": 115, "count": 2, "color": "#FFD54F"},
      {"unit_type": "n3", "area_sqm": 81, "count": 4, "color": "#81C784"}
    ], "total_units": 8},
    {"floor_number": 2, "floor_type": "typical", "floor_label": "קומה 2", "units": [
      {"unit_type": "n4", "area_sqm": 109, "count": 4, "color": "#FFD54F"},
      {"unit_type": "n4", "area_sqm": 115, "count": 4, "color": "#FFD54F"},
      {"unit_type": "n3", "area_sqm": 81, "count": 4, "color": "#81C784"}
    ], "total_units": 12},
    {"floor_number": 3, "floor_type": "typical", "floor_label": "קומה 3", "units": [
      {"unit_type": "n4", "area_sqm": 109, "count": 4, "color": "#FFD54F"},
      {"unit_type": "n4", "area_sqm": 115, "count": 4, "color": "#FFD54F"},
      {"unit_type": "n3", "area_sqm": 81, "count": 4, "color": "#81C784"}
    ], "total_units": 12},
    {"floor_number": 4, "floor_type": "typical", "units": [...], "total_units": 12},
    {"floor_number": 5, "floor_type": "typical", "units": [...], "total_units": 12},
    {"floor_number": 6, "floor_type": "typical", "units": [...], "total_units": 12},
    {"floor_number": 7, "floor_type": "typical", "units": [...], "total_units": 12},
    {"floor_number": 8, "floor_type": "typical", "units": [...], "total_units": 12},
    {"floor_number": 9, "floor_type": "typical", "floor_label": "קומה 9", "units": [
      {"unit_type": "n5", "area_sqm": 135, "count": 4, "color": "#FF8A65"},
      {"unit_type": "n5", "area_sqm": 145, "count": 4, "color": "#FF8A65"}
    ], "total_units": 8},
    {"floor_number": 10, "floor_type": "typical", "units": [...], "total_units": 8},
    {"floor_number": 11, "floor_type": "typical", "units": [...], "total_units": 8},
    {"floor_number": 12, "floor_type": "typical", "units": [...], "total_units": 8},
    {"floor_number": 13, "floor_type": "typical", "units": [...], "total_units": 8},
    {"floor_number": 14, "floor_type": "typical", "units": [...], "total_units": 8},
    {"floor_number": 15, "floor_type": "penthouse", "floor_label": "קומה 15", "units": [
      {"unit_type": "n5", "area_sqm": 135, "count": 2, "color": "#FF8A65"},
      {"unit_type": "n5", "area_sqm": 145, "count": 2, "color": "#FF8A65"},
      {"unit_type": "mini_ph", "area_sqm": 154, "count": 2, "color": "#CE93D8"}
    ], "total_units": 6},
    {"floor_number": 16, "floor_type": "penthouse", "floor_label": "קומה 16", "units": [
      {"unit_type": "ph", "area_sqm": 180, "count": 4, "color": "#4FC3F7"}
    ], "total_units": 4}
  ],
  "unit_mix_summary": [
    {"unit_type": "n3", "label": "n3", "total_count": 31, "percentage": 21},
    {"unit_type": "n4", "label": "n4", "total_count": 63, "percentage": 42},
    {"unit_type": "n5", "label": "n5", "total_count": 52, "percentage": 35},
    {"unit_type": "mini_ph", "label": "mini PH", "total_count": 1, "percentage": 1},
    {"unit_type": "ph", "label": "PH", "total_count": 3, "percentage": 2}
  ],
  "design_notes": [
    "Designed for {MAX_UNITS} units across {FLOORS_MAX} floors",
    "2 towers with shared amenities"
  ]
}
\`\`\`

**CRITICAL VALIDATION BEFORE RESPONDING:**
1. Sum all floor_plans[].total_units = MUST equal {MAX_UNITS} exactly
2. Sum unit_mix_summary[].total_count = MUST equal {MAX_UNITS} exactly
3. unit_mix_summary[].percentage values MUST sum to 100
4. For each unit_type in unit_mix_summary, count how many appear in floor_plans - they MUST match

**COMMON ERRORS TO AVOID:**
- Don't count amenities (commercial, lobby, pool, club) as residential units
- Floor 0 (ground) should have total_units: 0
- Penthouses only on top floor
- Double-check your math before responding

Return ONLY the JSON, no additional text.`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
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
    const { planningRights } = req.body as { planningRights: PlanningRightsInput };

    if (!planningRights) {
      return res.status(400).json({ error: 'Missing planningRights in request body' });
    }

    console.log(`[Tamhil] Generating for Gush ${planningRights.parcel.gush}, Helka ${planningRights.parcel.helka}`);
    console.log(`[Tamhil] Rights: ${planningRights.rights.max_units} units, ${planningRights.rights.floors_max} floors, ${planningRights.rights.main_area_sqm} sqm`);

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    // Build the prompt with actual values
    const prompt = TAMHIL_GENERATION_PROMPT
      .replace('{PLANNING_RIGHTS}', JSON.stringify(planningRights, null, 2))
      .replace(/{MAX_UNITS}/g, String(planningRights.rights.max_units))
      .replace(/{MAIN_AREA_SQM}/g, String(planningRights.rights.main_area_sqm))
      .replace(/{FLOORS_MAX}/g, String(planningRights.rights.floors_max));

    // Call Gemini
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: { parts: [{ text: prompt }] },
    });

    const responseText = response.text || '';
    console.log('[Tamhil] Received response from Gemini');

    // Parse JSON from response
    let tamhil;
    try {
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : responseText;
      tamhil = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('[Tamhil] Failed to parse JSON:', responseText);
      return res.status(500).json({ 
        error: 'Failed to parse Tamhil generation results',
        raw: responseText 
      });
    }

    // Add timestamp
    tamhil.generated_at = new Date().toISOString();

    console.log(`[Tamhil] Generated: ${tamhil.building_summary?.total_units} units across ${tamhil.building_summary?.total_floors} floors`);

    return res.status(200).json({ tamhil });

  } catch (error: any) {
    console.error('[Tamhil] Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
