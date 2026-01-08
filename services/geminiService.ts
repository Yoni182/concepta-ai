import { AppState, DetectedMaterial, DesignAlternative, ArchitecturalIntelligence } from "../types";

export class GeminiService {
  async analyzeModel(base64Image: string): Promise<string> {
    const response = await fetch('/api/analyze-model', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageData: base64Image.split(',')[1] })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Model analysis failed');
    }

    const data = await response.json();
    return data.description;
  }

  async analyzeBuildingRef(base64Image: string): Promise<{ description: string; materials: DetectedMaterial[]; intel: ArchitecturalIntelligence }> {
    const response = await fetch('/api/analyze-building-ref', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageData: base64Image.split(',')[1] })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Building reference analysis failed');
    }

    return response.json();
  }

  async generateAlternatives(state: AppState): Promise<DesignAlternative[]> {
    const response = await fetch('/api/generate-alternatives', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        modelImage: state.modelImage,
        modelDescription: state.analysisResults?.modelDescription,
        detectedMaterials: state.detectedMaterials,
        selectedMaterialIds: state.selectedMaterialIds,
        manualMaterialImages: state.manualMaterialImages,
        archIntelligence: state.analysisResults?.archIntelligence,
        contextSetting: state.contextSetting,
        groundFloorType: state.groundFloorType,
        groundFloorDescription: state.groundFloorDescription,
        lightingConfig: state.lightingConfig
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Generation failed');
    }

    return response.json();
  }
}
