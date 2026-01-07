console.log('🔥 [1] Node.js process started');

import dotenv from 'dotenv';
import path from 'path';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { GoogleGenAI, Type } from '@google/genai';

console.log('🔥 [2] All imports successful');

// Load .env.local explicitly (for local development)
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

console.log('🔥 [3] dotenv configured');
console.log('✅ App starting...');
console.log('📍 GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✓ set' : '❌ NOT SET');

const app = express();
const PORT = parseInt(process.env.PORT || '3002', 10);

console.log(`📍 PORT: ${PORT}`);

// CORS - Must use middleware BEFORE routes
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 3600
}));

app.use(express.json({ limit: '50mb' }));

const getClient = () => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Health check
app.get('/health', (req: Request, res: Response) => {
  console.log('📍 Health check requested');
  res.json({ status: 'ok' });
});

// Analyze 3D Model
app.post('/api/analyze-model', async (req: Request, res: Response) => {
  try {
    console.log('📍 /api/analyze-model request received');
    const { imageData } = req.body;
    if (!imageData) return res.status(400).json({ error: 'Missing imageData' });

    const ai = getClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { text: "Analyze this architectural massing model. Identify floors, balconies, structural lines, and residential/commercial usage based on color (White=Residential, Blue=Commercial). Describe the geometry, camera perspective, and proportions precisely. This is a locked geometry check." },
          { inlineData: { mimeType: 'image/png', data: imageData } }
        ]
      }
    });

    const description = response.text || "Standard architectural massing model.";
    res.json({ description });
  } catch (error: any) {
    console.error('❌ Analyze model error:', error);
    res.status(500).json({ error: error.message || 'Analysis failed' });
  }
});

// Analyze Building Reference
app.post('/api/analyze-building-ref', async (req: Request, res: Response) => {
  try {
    const { imageData } = req.body;
    if (!imageData) return res.status(400).json({ error: 'Missing imageData' });

    const ai = getClient();

    // Extract architectural intelligence
    const intelResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { text: `Perform a deep architectural system analysis on this building reference image. 
          Extract logic for the following 8 modules:
          1. Massing & Volumetric Logic (Vertical/horizontal hierarchy, podium vs tower, stepping/terracing).
          2. Façade Zoning & Hierarchy (Ground floor vs upper levels, typical floor repetition, balcony differentiation).
          3. Geometric Language (Line orientation bias, curvature vs orthogonality, corner typology, rhythm regularity).
          4. Architectural Elements Logic (Role of beams, beam-railing-slab relationships, structural readability).
          5. Material System Behavior (Dominance, contrast strategy, field continuity, surface reflectivity).
          6. Indoor-Outdoor Relationship (Balcony depth, visual permeability, transition softness).
          7. Green Integration Logic (Greenery as architectural layer vs decoration, rhythm alignment).
          8. Human Scale & Ground Activation (Transparency, human scale cues, engagement depth).
          
          Provide a concise description of the overall architectural system.` },
          { inlineData: { mimeType: 'image/png', data: imageData } }
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
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { text: "Identify the 3-5 primary materials in this architectural image. For each, return 'name', a technical 'description' (texture, finish, behavior), and a 'hexColor'. These will be used as recommendations." },
          { inlineData: { mimeType: 'image/png', data: imageData } }
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

    res.json({
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
});

// Generate Design Alternatives
app.post('/api/generate-alternatives', async (req: Request, res: Response) => {
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

    const ai = getClient();

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
          ...manualMaterialImages.map((_: any, i: number) => ({ name: `Custom Ref ${i + 1}`, description: "User provided reference image texture." }))
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

        const response = await ai.models.generateContent({
          model: 'gemini-3-pro-image-preview',
          contents: {
            parts: [
              { text: prompt },
              { inlineData: { mimeType: 'image/png', data: modelImage.split(',')[1] } }
            ]
          },
          config: {
            imageConfig: { aspectRatio: "16:9", imageSize: "1K" }
          }
        });

        let url = '';
        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if ((part as any).inlineData) {
            url = `data:image/png;base64,${(part as any).inlineData.data}`;
            break;
          }
        }

        if (!url) throw new Error("Generation engine failed to return an image.");

        return { ...v, description: v.logic, url };
      })
    );

    res.json(results);
  } catch (error: any) {
    console.error('Generate alternatives error:', error);
    res.status(500).json({ error: error.message || 'Generation failed' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend running on port ${PORT}`);
  console.log(`📍 Health check: http://0.0.0.0:${PORT}/health`);
}).on('error', (err: any) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});

// Catch unhandled errors
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled rejection:', reason);
  process.exit(1);
});
