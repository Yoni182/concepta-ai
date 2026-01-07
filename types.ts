
export enum AppStage {
  MODEL_INPUT = 'MODEL_INPUT',
  BUILDING_REF = 'BUILDING_REF',
  MATERIAL_STRATEGY = 'MATERIAL_STRATEGY',
  ATMOSPHERE = 'ATMOSPHERE',
  SUMMARY = 'SUMMARY',
  GENERATING = 'GENERATING',
  RESULT = 'RESULT'
}

export type GroundFloorOption = 'Lobby' | 'Retail' | 'Other';

export interface LightingConfig {
  preset: string;
  sunAzimuth: number;
  sunIntensity: number;
  timeOfDay: string;
  haze: number;
}

export interface DetectedMaterial {
  id: string;
  name: string;
  description: string;
  hexColor: string;
  isCustom?: boolean;
  base64?: string;
}

export interface DesignAlternative {
  id: string;
  label: string;
  description: string;
  rationale: {
    dominance: string;
    softened: string;
    emphasis: string;
  };
  url: string;
}

export interface ArchitecturalIntelligence {
  massingHierarchy: string;
  facadeZoning: string;
  geometricLanguage: string;
  elementLogic: string;
  materialSystem: string;
  indoorOutdoor: string;
  greenIntegration: string;
  humanScale: string;
}

export interface AppState {
  stage: AppStage;
  modelImage: string | null;
  buildingRefImage: string | null;
  detectedMaterials: DetectedMaterial[];
  selectedMaterialIds: string[];
  manualMaterialImages: string[];
  groundFloorType: GroundFloorOption;
  groundFloorDescription: string;
  lightingConfig: LightingConfig;
  contextSetting: string;
  analysisResults?: {
    modelDescription: string;
    buildingRefDescription: string;
    archIntelligence: ArchitecturalIntelligence;
  };
  finalAlternatives: DesignAlternative[];
  error?: string;
}

export const LIGHTING_PRESETS = [
  { name: 'Golden Hour', time: '18:30', azimuth: 240, intensity: 85, haze: 20 },
  { name: 'High Noon', time: '12:00', azimuth: 180, intensity: 100, haze: 5 },
  { name: 'Overcast', time: '14:00', azimuth: 0, intensity: 40, haze: 60 },
  { name: 'Blue Hour', time: '06:00', azimuth: 60, intensity: 30, haze: 15 },
  { name: 'Night City', time: '22:00', azimuth: 0, intensity: 10, haze: 10 },
];

export const CONTEXT_PRESETS = [
  { id: 'dense-urban', name: 'Dense Urban', desc: 'Metropolitan street with tight neighboring buildings.' },
  { id: 'park-landscape', name: 'Park Setting', desc: 'Lush greenery and soft landscaping elements.' },
  { id: 'business-park', name: 'Modern Business Park', desc: 'Campus-style setting with glass neighbors.' },
  { id: 'residential-hood', name: 'Residential Neighborhood', desc: 'Low-rise context with domestic scales.' },
  { id: 'minimal-neutral', name: 'Minimal Context', desc: 'Abstract environment focusing on mass.' }
];
