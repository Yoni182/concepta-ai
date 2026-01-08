import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      modelImage,
      modelDescription,
      detectedMaterials,
      selectedMaterialIds,
      manualMaterialImages,
      archIntelligence,
      contextSetting,
      groundFloorType,
      groundFloorDescription,
      lightingConfig
    } = req.body;

    if (!modelImage || !modelDescription || !archIntelligence) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const variants = [
      {
        id: 'v1',
        label: 'Alternative A: Structure-Led',
        logic: 'Structure-Led: Façade reads through beams, slabs, and horizontal articulation. Strong expression of construction logic. Clear hierarchy between podium, terraces, and upper masses.',
        rationale: {
          dominance: 'Structural beams, slabs, and tectonic articulation',
          softened: 'Visual material continuity and surface fluidity',
          emphasis: 'Rational, architectural, and "constructed" logic'
        }
      },
      {
        id: 'v2',
        label: 'Alternative B: Material-Led',
        logic: 'Material-Led: Façade reads as continuous material fields. Softer transitions between zones. Reduced visibility of structural articulation to favor material surface behavior.',
        rationale: {
          dominance: 'Continuous material fields and surface textures',
          softened: 'Visibility of beams and structural skeletons',
          emphasis: 'Calm, elegant, and materially-driven translation'
        }
      },
      {
        id: 'v3',
        label: 'Alternative C: Spatial & Human',
        logic: 'Spatial & Human: Emphasis on balconies, terraces, and indoor-outdoor relationships. Stronger presence of greenery and human-scale elements. Porous and layered façade reading.',
        rationale: {
          dominance: 'Balcony depth, visual permeability, and green layers',
          softened: 'Rigid mass transitions and structural coldness',
          emphasis: 'Vibrant, livable, and human-scaled architectural interface'
        }
      }
    ];

    const results = await Promise.all(
      variants.map(async (v) => {
        const activeMaterials = [
          ...detectedMaterials.filter((m: any) => selectedMaterialIds.includes(m.id)),
          ...manualMaterialImages.map((_: any, i: number) => ({ 
            name: `Custom Ref ${i + 1}`, 
            description: "User provided reference image texture." 
          }))
        ];

        const materialText = activeMaterials.map((m: any) => `- ${m.name}: ${m.description}`).join('\n');

        const prompt = `
          TASK: Translate the PROVIDED abstract 3D massing model into an ultra-photorealistic architectural visualization.
          
          GEOMETRY FIDELITY (NON-NEGOTIABLE):
          - ${modelDescription}
          - Absolute fidelity to massing, camera angle, floor positions, and proportions. Do not alter or redesign geometry.
          
          ARCHITECTURAL SYSTEM INTELLIGENCE (LOCKED INPUTS):
          - Massing Logic: ${archIntelligence.massingHierarchy}
          - Facade Zoning: ${archIntelligence.facadeZoning}
          - Geometric Language: ${archIntelligence.geometricLanguage}
          - Element Coupling: ${archIntelligence.elementLogic}
          - Indoor-Outdoor: ${archIntelligence.indoorOutdoor}
          - Green Integration: ${archIntelligence.greenIntegration}
          - Human Scale: ${archIntelligence.humanScale}
          
          INTERPRETATION VARIANT:
          - ${v.logic}
          
          GOVERNING CONSTRAINTS:
          - FIBONACCI PROPORTIONAL LOGIC: Apply Fibonacci sequence (1:1:2:3:5) and Golden Ratio (1.618) to all façade rhythm segmentation, material area ratios, and element distribution.
          - SCIENTIFIC COLOR HARMONY: Perform analytical hue-proportion matching. Ensure tonal balance and perceptual coherence based on color theory between these materials:
          ${materialText}
          
          ENVIRONMENT:
          - Context: ${contextSetting}
          - Lighting: ${lightingConfig.preset} (${lightingConfig.timeOfDay})
          - Ground Floor Type: ${groundFloorType}
          - Ground Floor Description: ${groundFloorDescription}
          
          QUALITY: 8K competition-grade, professional architectural photography style, cinematic lighting, accurate reflections, high structural clarity.
        `;

        // Extract base64 data from data URL if present
        const imageBase64 = modelImage.includes(',') ? modelImage.split(',')[1] : modelImage;

        const response = await ai.models.generateContent({
          model: 'gemini-3-pro-image-preview',
          contents: {
            parts: [
              { text: prompt },
              { inlineData: { mimeType: 'image/png', data: imageBase64 } }
            ]
          },
          config: {
            responseModalities: ['Text', 'Image'],
          }
        });

        let url = '';
        const parts = response.candidates?.[0]?.content?.parts || [];
        console.log(`[${v.id}] Response received, parts: ${parts.length}`);
        
        for (const part of parts) {
          if ((part as any).inlineData) {
            url = `data:image/png;base64,${(part as any).inlineData.data}`;
            console.log(`[${v.id}] Image generated successfully`);
            break;
          }
        }

        if (!url) {
          console.error(`[${v.id}] No image in response`);
          throw new Error("Generation engine failed to return an image.");
        }

        return { ...v, description: v.logic, url };
      })
    );

    res.status(200).json(results);
  } catch (error: any) {
    console.error('Generate alternatives error:', error);
    res.status(500).json({ error: error.message || 'Generation failed' });
  }
}
