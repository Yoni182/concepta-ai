import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from '@google/genai';

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

    // Extract architectural intelligence
    const intelResponse = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: {
        parts: [
          { 
            text: `Perform a deep architectural system analysis on this building reference image. 
            Extract logic for the following 8 modules:
            1. Massing & Volumetric Logic (Vertical/horizontal hierarchy, podium vs tower, stepping/terracing).
            2. Façade Zoning & Hierarchy (Ground floor vs upper levels, typical floor repetition, balcony differentiation).
            3. Geometric Language (Line orientation bias, curvature vs orthogonality, corner typology, rhythm regularity).
            4. Architectural Elements Logic (Role of beams, beam-railing-slab relationships, structural readability).
            5. Material System Behavior (Dominance, contrast strategy, field continuity, surface reflectivity).
            6. Indoor-Outdoor Relationship (Balcony depth, visual permeability, transition softness).
            7. Green Integration Logic (Greenery as architectural layer vs decoration, rhythm alignment).
            8. Human Scale & Ground Activation (Transparency, human scale cues, engagement depth).
            
            Provide a concise description of the overall architectural system.` 
          },
          { 
            inlineData: { mimeType: 'image/png', data: imageData } 
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
            massingHierarchy: { type: Type.STRING },
            facadeZoning: { type: Type.STRING },
            geometricLanguage: { type: Type.STRING },
            elementLogic: { type: Type.STRING },
            materialSystem: { type: Type.STRING },
            indoorOutdoor: { type: Type.STRING },
            greenIntegration: { type: Type.STRING },
            humanScale: { type: Type.STRING }
          },
          required: [
            "description", "massingHierarchy", "facadeZoning", "geometricLanguage",
            "elementLogic", "materialSystem", "indoorOutdoor", "greenIntegration", "humanScale"
          ]
        }
      }
    });

    const intel = JSON.parse(intelResponse.text || '{}');

    // Detect materials
    const matResponse = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: {
        parts: [
          { 
            text: "Identify the 3-5 primary materials in this architectural image. For each, return 'name', a technical 'description' (texture, finish, behavior), and a 'hexColor'. These will be used as recommendations." 
          },
          { 
            inlineData: { mimeType: 'image/png', data: imageData } 
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              hexColor: { type: Type.STRING }
            },
            required: ["name", "description", "hexColor"]
          }
        }
      }
    });

    const materials = JSON.parse(matResponse.text || '[]').map((m: any, i: number) => ({
      ...m,
      id: `detected-${i}`
    }));

    res.status(200).json({
      description: intel.description,
      materials,
      intel: {
        massingHierarchy: intel.massingHierarchy,
        facadeZoning: intel.facadeZoning,
        geometricLanguage: intel.geometricLanguage,
        elementLogic: intel.elementLogic,
        materialSystem: intel.materialSystem,
        indoorOutdoor: intel.indoorOutdoor,
        greenIntegration: intel.greenIntegration,
        humanScale: intel.humanScale
      }
    });
  } catch (error: any) {
    console.error('Analyze building ref error:', error);
    res.status(500).json({ error: error.message || 'Analysis failed' });
  }
}
