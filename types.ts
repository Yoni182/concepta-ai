
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

// ============================================
// STAGE 1: ZONING ANALYSIS TYPES
// ============================================

export type AppModule = 'zoning' | 'visualization';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface ParcelInfo {
  gush: string;
  helka: string;
  area_net_sqm: number;
  address?: string;
  city?: string;
}

export interface ZoningInfo {
  primary_use: string;
  allowed_secondary_uses: string[];
  plan_number?: string;
  plan_name?: string;
}

export interface BuildingRights {
  max_units: number;
  main_area_sqm: number;
  service_area_sqm: number;
  balcony_area_sqm?: number;
  floors_max: number;
  floors_below_ground?: number;
  height_max_m: number;
  coverage_percent?: number;
}

export interface BuildingConstraints {
  building_lines: {
    front_m: number;
    side_m: number;
    rear_m: number;
  };
  parking_ratio: string;
  parking_spaces?: number;
  commercial_frontage?: boolean;
}

export interface RiskNote {
  type: 'ambiguity' | 'conflict' | 'missing' | 'interpretation';
  description: string;
  clause_reference?: string;
}

export interface PlanningRightsObject {
  parcel: ParcelInfo;
  zoning: ZoningInfo;
  rights: BuildingRights;
  constraints: BuildingConstraints;
  confidence_level: ConfidenceLevel;
  risk_notes: RiskNote[];
  extracted_at: string;
}

export interface ZoningDocument {
  id: string;
  name: string;
  file: File;
  base64: string;
  type: 'regulations' | 'rights_table' | 'appendix' | 'unknown';
}

// ============================================
// STAGE 2: TAMHIL (UNIT MIX) TYPES
// ============================================

export interface UnitType {
  id: string;
  name: string;           // e.g., "2-Room", "3-Room", "4-Room", "Penthouse"
  rooms: number;          // Number of rooms
  area_sqm: number;       // Unit size in sqm
  has_balcony: boolean;
  balcony_sqm?: number;
}

export interface FloorUnit {
  unit_type_id?: string;
  unit_type_name?: string;
  unit_type?: string;     // New: n3, n4, n5, mini_ph, ph
  label?: string;         // New: Display label
  rooms: number;
  area_sqm: number;
  count: number;          // How many of this type on this floor
  color?: string;         // New: Color for visualization
}

export interface FloorPlan {
  floor_number: number;
  floor_type: 'typical' | 'ground' | 'penthouse' | 'technical' | 'roof';
  floor_label?: string;   // New: Hebrew floor label
  units: FloorUnit[];
  total_units: number;
  total_area_sqm: number;
}

export interface UnitMixSummary {
  unit_type_name?: string;
  unit_type?: string;     // New: n3, n4, n5, mini_ph, ph
  label?: string;         // New: Display label with rooms
  rooms: number;
  area_sqm?: number;
  avg_area_sqm?: number;  // New: Average size
  total_count: number;
  total_area_sqm: number;
  percentage: number;     // % of total units
}

export interface GroundFloorAmenity {
  type: 'commercial' | 'lobby' | 'pool' | 'club';
  label: string;        // Hebrew label
  area_sqm: number;
  color: string;
}

export interface TamhilOutput {
  project_info: {
    gush: string;
    helka: string;
    plan_number?: string;
  };
  building_summary: {
    num_buildings?: number;   // Number of towers
    total_floors: number;
    floors_below_ground: number;
    floors_above_ground: number;
    total_units: number;
    total_main_area_sqm: number;
    total_service_area_sqm: number;
    total_balcony_area_sqm: number;
    average_unit_size_sqm?: number;
  };
  ground_floor_amenities?: GroundFloorAmenity[];  // Pool, club, lobby, commercial
  floor_plans: FloorPlan[];
  unit_mix_summary: UnitMixSummary[];
  color_legend?: Record<string, string>;
  design_notes: string[];
  generated_at: string;
}

export interface ZoningAnalysisState {
  stage: 'input' | 'processing' | 'rights_result' | 'generating_tamhil' | 'tamhil_result' | 'generating_massing' | 'massing_result' | 'visualization_step' | 'visualization_analyzing' | 'visualization_generating' | 'visualization_result';
  gush: string;
  helka: string;
  documents: ZoningDocument[];
  result: PlanningRightsObject | null;
  report: string | null;
  tamhil: TamhilOutput | null;
  massing: any | null; // Massing alternative data
  error: string | null;
}

// ============================================
// STAGE 4: VISUALIZATION TYPES
// ============================================

export interface DesignDNA {
  architectural_style: string;
  facade_language: string;
  material_palette: string[];
  color_scheme: {
    primary: string;
    secondary: string[];
    accent: string;
  };
  proportional_logic: string;
  fenestration_pattern: string;
  vertical_rhythm: string;
  horizontal_banding: string;
  surface_articulation: string;
  human_scale_elements: string;
}

export interface StyledMassing {
  id: string;
  reference_image_base64: string;
  design_dna: DesignDNA;
  massing_geometry: any; // From selected MassingAlternative
  styled_materials: {
    primary_material: {
      name: string;
      color: string;
      texture: string;
    };
    secondary_materials: Array<{
      name: string;
      color: string;
      texture: string;
      area_percent: number;
    }>;
    accent_color: string;
  };
  design_description: string;
  generated_at: string;
}
