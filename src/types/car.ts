// Car data types based on the 79 features dataset

export interface Car {
  // Identification (6 features)
  _id?: string;
  brand: string;
  model: string;
  variant: string;
  year: number;
  bodyType: string;
  segment: string;

  // Pricing (1 feature)
  priceInLakhs: number;

  // Dimensions (8 features)
  length: number;
  width: number;
  height: number;
  wheelbase: number;
  groundClearance: number;
  weight: number;
  turningRadius: number;
  fuelTank: number;

  // Engine (5 features)
  displacement: number;
  cylinders: number;
  turboNA: "Turbo" | "NA";
  powerBhp: number;
  torqueNm: number;

  // Transmission (3 features)
  transmissionType: "Manual" | "Automatic" | "CVT" | "DCT";
  gearCount: number;
  driveType: "FWD" | "AWD" | "4WD" | "RWD";

  // Performance (2 features)
  acceleration0to100: number;
  topSpeed: number;

  // Fuel & Emissions (3 features)
  mileageARAI: number;
  emissionStandard: string;
  adBlueSystem: boolean;

  // Safety (10 features)
  airbags: number;
  abs: boolean;
  esc: boolean;
  crashTestRating: number;
  parkingSensors: boolean;
  parkingCamera: boolean;
  isofix: boolean;
  hillHoldControl: boolean;
  tractionControl: boolean;
  electronicBrakeDistribution: boolean;

  // Comfort (12 features)
  airConditioning: boolean;
  ventilatedSeats: boolean;
  keylessEntry: boolean;
  cruiseControl: boolean;
  sunroof: boolean;
  heatedSeats: boolean;
  lumbarSupport: boolean;
  adjustableHeadrest: boolean;
  rearArmrest: boolean;
  cupHolders: number;
  powerWindows: boolean;
  centralLocking: boolean;

  // Infotainment (8 features)
  touchscreenSize: number;
  carPlayAndroidAuto: boolean;
  speakers: number;
  digitalCluster: boolean;
  connectedTech: boolean;
  wirelessCharging: boolean;
  usbPorts: number;
  bluetoothConnectivity: boolean;

  // Practicality (4 features)
  bootSpace: number;
  foldableSeats: boolean;
  roofRails: boolean;
  spareWheel: "Full" | "Stepney" | "None";

  // Exterior (6 features)
  wheelSize: number;
  ledHeadlights: boolean;
  drl: boolean;
  fogLamps: boolean;
  autoFoldingMirrors: boolean;
  alloyWheels: boolean;

  // ADAS (7 features)
  adaptiveCruise: boolean;
  laneKeepAssist: boolean;
  collisionWarning: boolean;
  automaticEmergencyBraking: boolean;
  blindSpotMonitor: boolean;
  rearCrossTrafficAlert: boolean;
  driverAttentionAlert: boolean;

  // Ownership (3 features)
  warranty: string;
  serviceInterval: number;
  roadsideAssistance: boolean;

  // Additional fields for UI
  images?: string[];
  rating?: number;
  reviewCount?: number;
  isFavorite?: boolean;
  isInWishlist?: boolean;

  // Variant grouping (when cars are grouped by model)
  variantCount?: number; // Number of variants for this model
  priceRange?: {
    min: number;
    max: number;
  };
  variants?: Array<{
    _id: string;
    name: string;
    price: number;
    transmission: string;
    fuelType: string;
  }>;
}

export interface CarFilter {
  brand?: string[];
  priceRange?: [number, number];
  fuelType?: string[];
  bodyType?: string[];
  transmissionType?: string[];
  yearRange?: [number, number];
  mileageRange?: [number, number];
  segment?: string[];
  features?: string[];
}

export interface CarComparison {
  cars: Car[];
  comparisonId: string;
  createdAt: Date;
}

export interface CarSearchResult {
  cars: Car[];
  total: number;
  page: number;
  limit: number;
  filters: CarFilter;
}

export interface AIRecommendation {
  query: string;
  recommendations: Car[];
  explanation: string;
  confidence: number;
  timestamp: Date;
}
