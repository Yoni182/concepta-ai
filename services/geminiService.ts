
import { GoogleGenAI, Type } from "@google/genai";
import { AppState, DetectedMaterial, DesignAlternative, ArchitecturalIntelligence } from "../types";

export class GeminiService {
  private getClient(): GoogleGenAI {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async analyzeModel(base64Image: string): Promise<string> {
    const ai = this.getClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { text: "Analyze this architectural massing model. Identify floors, balconies, structural lines, and residential/commercial usage based on color (White=Residential, Blue=Commercial). Describe the geometry, camera perspective, and proportions precisely. This is a locked geometry check." },
          { inlineData: { mimeType: 'image/png', data: base64Image.split(',')[1] } }
        ]
      }
    });
    return response.text || "Standard architectural massing model.";
  }

  async analyzeBuildingRef(base64Image: string): Promise<{ description: string; materials: DetectedMaterial[]; intel: ArchitecturalIntelligence }> {
    const ai = this.getClient();
    
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
          { inlineData: { mimeType: 'image/png', data: base64Image.split(',')[1] } }
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

    const intel = JSON.parse(intelResponse.text);

    const matResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { text: "Identify the 3-5 primary materials in this architectural image. For each, return 'name', a technical 'description' (texture, finish, behavior), and a 'hexColor'. These will be used as recommendations." },
          { inlineData: { mimeType: 'image/png', data: base64Image.split(',')[1] } }
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

    const materials = JSON.parse(matResponse.text).map((m: any, i: number) => ({
      ...m,
      id: `detected-${i}`
    }));

    return {
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
    };
  }

  async generateAlternatives(state: AppState): Promise<DesignAlternative[]> {
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

    const results = await Promise.all(variants.map(async (v) => {
      const url = await this.generateSingleAlternative(state, v.logic);
      return { ...v, description: v.logic, url };
    }));

    return results;
  }

  private async generateSingleAlternative(state: AppState, variantLogic: string): Promise<string> {
    const ai = this.getClient();
    const activeMaterials = [
      ...state.detectedMaterials.filter(m => state.selectedMaterialIds.includes(m.id)),
      ...state.manualMaterialImages.map((_, i) => ({ name: `Custom Ref ${i+1}`, description: "User provided reference image texture." }))
    ];

    const materialText = activeMaterials.map(m => `- ${m.name}: ${m.description}`).join('\n');
    const intel = state.analysisResults?.archIntelligence;

    const prompt = `
      TASK: Translate the PROVIDED abstract 3D massing model into an ultra-photorealistic architectural visualization.
      
      GEOMETRY FIDELITY (NON-NEGOTIABLE):
      - ${state.analysisResults?.modelDescription}
      - Absolute fidelity to massing, camera angle, floor positions, and proportions. Do not alter or redesign geometry.
      
      ARCHITECTURAL SYSTEM INTELLIGENCE (LOCKED INPUTS):
      - Massing Logic: ${intel?.massingHierarchy}
      - Facade Zoning: ${intel?.facadeZoning}
      - Geometric Language: ${intel?.geometricLanguage}
      - Element Coupling: ${intel?.elementLogic}
      - Indoor-Outdoor: ${intel?.indoorOutdoor}
      - Green Integration: ${intel?.greenIntegration}
      - Human Scale: ${intel?.humanScale}
      
      INTERPRETATION VARIANT:
      - ${variantLogic}
      
      GOVERNING CONSTRAINTS:
      - FIBONACCI PROPORTIONAL LOGIC: Apply Fibonacci sequence (1:1:2:3:5) and Golden Ratio (1.618) to all façade rhythm segmentation, material area ratios, and element distribution.
      - SCIENTIFIC COLOR HARMONY: Perform analytical hue-proportion matching. Ensure tonal balance and perceptual coherence based on color theory between these materials:
      ${materialText}
      
      ENVIRONMENT:
      - Context: ${state.contextSetting}
      - Lighting: ${state.lightingConfig.preset} (${state.lightingConfig.timeOfDay})
      - Ground Floor Type: ${state.groundFloorType}
      - Ground Floor Description: ${state.groundFloorDescription}
      
      QUALITY: 8K competition-grade, professional architectural photography style, cinematic lighting, accurate reflections, high structural clarity.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          { text: prompt },
          { inlineData: { mimeType: 'image/png', data: state.modelImage!.split(',')[1] } }
        ]
      },
      config: {
        imageConfig: { aspectRatio: "16:9", imageSize: "1K" }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error("Generation engine failed to return an image.");
  }
}
