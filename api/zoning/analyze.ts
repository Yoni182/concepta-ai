import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

interface DocumentInput {
  name: string;
  base64: string;
  type: string;
}

interface RequestBody {
  gush: string;
  helka: string;
  documents: DocumentInput[];
}

const ZONING_ANALYSIS_PROMPT = `You are an expert Israeli urban planner and architect specializing in analyzing TABA (תב"ע) zoning documents.

Analyze the attached PDF document carefully. This is an Israeli zoning/planning document.

**CRITICAL: The building rights data is in TABLE 5 (טבלה מספר 5 / טבלת זכויות והוראות בניה)**

Find Table 5 in the document - it's titled something like:
- "טבלה 5 - טבלת זכויות והוראות בניה"
- "5. טבלת זכויות והוראות בניה"
- "טבלת זכויות בנייה"

**EXACT FIELDS TO EXTRACT from the Tamhil (תמהיל) page:**

Look for a page titled "מתחם 16 | מגרש {HELKA}" or similar with "תמהיל" header.

Extract these EXACT fields:
- "גודל מגרש" = parcel area in sqm (e.g., 4006) → area_net_sqm
- "יח"ד" = TOTAL housing units (e.g., 150) → max_units (use the TOTAL, not per-building)
- "קומות" = floors description → floors_max (count the number, e.g., "מסחר+16+גג" = ~17)
- "עיקרי מגורים" = main residential area (e.g., 14,700) → main_area_sqm
- "שירות עילי" = upper service area → service_area_sqm  
- "מרפסות" = balcony area → balcony_area_sqm
- "חניות" or "סה"כ חניות" = total parking spaces → parking_spaces
- "קומות חניון" = parking floors

**ALSO extract from Table 5 (טבלה 5) - find the row for מגרש {HELKA}:**
- "גובה מבנה- מעל הכניסה הקובעת (מטר)" = building height above determining entrance in METERS → height_max_m
  Example: if the column shows "75" → height_max_m = 75
- "קומת מסחר" or "קומת קרקע מסחרית" = commercial floor (include in floor description)
- The height is a NUMBER in meters (e.g., 75, 52.5, 60) - MUST extract this value!

**IMPORTANT:**
- If it says "יח"ד: 150" and then "חלוקה ל-2 בניינים של 75" - the total is 150, not 75!
- Use the TOTAL values, not per-building splits

**Parcel to analyze:**
- Gush (גוש): {GUSH}
- Helka (חלקה/מגרש): {HELKA}

**Instructions:**
1. Find the data for parcel/מגרש {HELKA} ONLY - do NOT sum other parcels!
2. Look for a section or table specifically about "מגרש {HELKA}" or "מתחם 16 | מגרש {HELKA}"
3. The document may have a "תמהיל" (unit mix) page for each parcel - find the one for {HELKA}
4. Extract ONLY the values for parcel {HELKA}, ignore all other parcels
5. DO NOT sum values from different parcels - we want ONLY parcel {HELKA}

**WARNING:** The document contains multiple parcels (101, 102, 103, etc.). 
You MUST extract data for parcel {HELKA} ONLY, not totals or sums!

**Return JSON in this exact format:**

\`\`\`json
{
  "parcel": {
    "gush": "the gush number you're analyzing",
    "helka": "the helka/parcel number",
    "area_net_sqm": 0
  },
  "zoning": {
    "primary_use": "residential/commercial/mixed/employment",
    "allowed_secondary_uses": ["list of secondary uses"],
    "plan_number": "plan number like 408-0872473",
    "plan_name": "plan name"
  },
  "rights": {
    "max_units": 0,
    "main_area_sqm": 0,
    "service_area_sqm": 0,
    "balcony_area_sqm": 0,
    "floors_max": 0,
    "floors_below_ground": 0,
    "height_max_m": 0,
    "coverage_percent": 0
  },
  "constraints": {
    "building_lines": {
      "front_m": 0,
      "side_m": 0,
      "rear_m": 0
    },
    "parking_ratio": "1:1",
    "parking_spaces": 0,
    "commercial_frontage": false
  },
  "confidence_level": "high/medium/low",
  "risk_notes": [
    {
      "type": "ambiguity/conflict/missing/interpretation",
      "description": "Description in CLEAR ENGLISH of any risk or uncertainty (no Hebrew)",
      "clause_reference": "relevant section reference"
    }
  ]
}

NOTE: All risk_notes descriptions must be in CLEAR ENGLISH only - translate any Hebrew terms.
\`\`\`

**CRITICAL - EXAMPLE FROM REAL DOCUMENT:** 
For מגרש 102, the Tamhil page shows:
- גודל מגרש: 4006 → area_net_sqm = 4006
- יח"ד: 150 → max_units = 150 (NOT 75, which is per building)
- עיקרי מגורים: 14,700 → main_area_sqm = 14700
- שירות עילי: 8,550 → service_area_sqm = 8550
- מרפסות: 2,250 → balcony_area_sqm = 2250
- סה"כ חניות: 244 → parking_spaces = 244
- קומות: מסחר+16+גג טכני → floors_max = 17

Extract the values EXACTLY as shown above for the parcel you're analyzing.

**Confidence levels:**
- high: All data clearly found in document
- medium: Some data requires interpretation
- low: Significant data missing

Return ONLY the JSON, no additional text.`;

// Report prompt is inline in the handler function

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
    const { gush, helka, documents } = req.body as RequestBody;

    if (!gush || !helka || !documents || documents.length === 0) {
      return res.status(400).json({ error: 'Missing required fields: gush, helka, documents' });
    }

    console.log(`[Zoning] Analyzing parcel: Gush ${gush}, Helka ${helka}, Documents: ${documents.length}`);

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    // Prepare document parts for Gemini
    const documentParts = documents.map(doc => {
      // Extract base64 data (remove data URL prefix if present)
      const base64Data = doc.base64.includes(',') ? doc.base64.split(',')[1] : doc.base64;
      return {
        inlineData: {
          mimeType: 'application/pdf',
          data: base64Data,
        },
      };
    });

    // Build the analysis prompt - replace all occurrences
    const analysisPrompt = ZONING_ANALYSIS_PROMPT
      .replace(/{GUSH}/g, gush)
      .replace(/{HELKA}/g, helka);

    console.log('[Zoning] Sending to Gemini for analysis...');
    console.log('[Zoning] Document parts count:', documentParts.length);
    console.log('[Zoning] First doc base64 length:', documentParts[0]?.inlineData?.data?.length || 0);

    // Call Gemini for structured extraction - using 2.0-flash-exp for document analysis
    const analysisResponse = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: {
        parts: [
          { text: analysisPrompt },
          ...documentParts,
        ],
      },
    });

    const analysisText = analysisResponse.text || '';
    console.log('[Zoning] Received analysis response, length:', analysisText.length);
    console.log('[Zoning] Response preview:', analysisText.substring(0, 500));

    // Parse JSON from response
    let planningRights;
    try {
      // Extract JSON from markdown code block if present
      const jsonMatch = analysisText.match(/```json\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : analysisText;
      planningRights = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('[Zoning] Failed to parse JSON:', analysisText);
      return res.status(500).json({ 
        error: 'Failed to parse analysis results',
        raw: analysisText 
      });
    }

    // Add extraction timestamp
    planningRights.extracted_at = new Date().toISOString();

    // Generate human-readable report
    console.log('[Zoning] Generating report...');
    const reportPrompt = `Based on the extracted planning rights, create a professional summary report in English.

**Extracted Data:**
${JSON.stringify(planningRights, null, 2)}

**Create a report including:**
1. Summary of building rights
2. Key constraints  
3. Important notes
4. Recommendations for further review (if relevant)

Keep it clear, professional, and concise.`;

    const reportResponse = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: { parts: [{ text: reportPrompt }] },
    });

    const report = reportResponse.text || '';

    console.log('[Zoning] Analysis complete');

    return res.status(200).json({
      planningRights,
      report,
    });

  } catch (error: any) {
    console.error('[Zoning] Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
