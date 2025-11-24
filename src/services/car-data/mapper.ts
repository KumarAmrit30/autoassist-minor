/* eslint-disable @typescript-eslint/no-explicit-any */
// Dynamic MongoDB car documents contain hundreds of vendor-specific keys,
// so we intentionally use `any` while normalizing them into the typed Car model.
import { Car } from "@/types/car";

/**
 * Maps database car document to Car interface
 * Handles the mismatch between database field names and application field names
 */
export function mapDatabaseCarToAppCar(dbCar: any): Car {
  return {
    _id: dbCar._id?.toString(),

    // Identification
    brand: dbCar.Identification_Brand || dbCar.brand || "",
    model: dbCar.Identification_Model || dbCar.model || "",
    variant: dbCar.Identification_Variant || dbCar.variant || "",
    year: dbCar.Identification_Year_of_Manufacture || dbCar.year || 2024,
    bodyType: dbCar.Identification_Body_Type || dbCar.bodyType || "",
    segment: dbCar.Identification_Segment || dbCar.segment || "",

    // Pricing
    priceInLakhs: dbCar.Price_Lakhs || dbCar.priceInLakhs || 0,

    // Dimensions
    length: dbCar.Dimensions_Length_mm || dbCar.length || 0,
    width: dbCar.Dimensions_Width_mm || dbCar.width || 0,
    height: dbCar.Dimensions_Height_mm || dbCar.height || 0,
    wheelbase: dbCar.Dimensions_Wheelbase_mm || dbCar.wheelbase || 0,
    groundClearance:
      dbCar.Dimensions_Ground_Clearance_mm || dbCar.groundClearance || 0,
    weight: dbCar.Dimensions_Kerb_Weight_kg || dbCar.weight || 0,
    turningRadius:
      dbCar.Dimensions_Turning_Radius_m || dbCar.turningRadius || 0,
    fuelTank: dbCar.Dimensions_Fuel_Tank_Capacity_litres || dbCar.fuelTank || 0,

    // Engine
    displacement:
      dbCar.Engine_Engine_Displacement_cc || dbCar.displacement || 0,
    cylinders: dbCar.Engine_Cylinder_Count || dbCar.cylinders || 0,
    turboNA: mapTurboNA(
      dbCar.Engine_Turbocharged_or_Naturally_Aspirated || dbCar.turboNA
    ),
    powerBhp: dbCar.Engine_Power_bhp || dbCar.powerBhp || 0,
    torqueNm: dbCar.Engine_Torque_Nm || dbCar.torqueNm || 0,

    // Transmission
    transmissionType: mapTransmissionType(
      dbCar.Transmission_Transmission_Type || dbCar.transmissionType
    ),
    gearCount: parseGearCount(dbCar.Transmission_Gear_Count || dbCar.gearCount),
    driveType: mapDriveType(dbCar.Transmission_Drive_Type || dbCar.driveType),

    // Performance
    acceleration0to100:
      dbCar["Performance_Acceleration_0-100_km_h_sec"] ||
      dbCar.acceleration0to100 ||
      0,
    topSpeed: dbCar.Performance_Top_Speed_km_h || dbCar.topSpeed || 0,

    // Fuel & Emissions
    mileageARAI:
      dbCar.Fuel_and_Emissions_Mileage_ARAI_kmpl || dbCar.mileageARAI || 0,
    emissionStandard:
      dbCar.Fuel_and_Emissions_Emission_Standard ||
      dbCar.emissionStandard ||
      "",
    adBlueSystem: mapBoolean(
      dbCar.Fuel_and_Emissions_AdBlue_System || dbCar.adBlueSystem
    ),

    // Safety
    airbags: dbCar.Safety_Airbags_Count || dbCar.airbags || 0,
    abs: mapBoolean(dbCar.Safety_ABS_with_EBD || dbCar.abs),
    esc: mapBoolean(dbCar.Safety_Electronic_Stability_Control_ESC || dbCar.esc),
    crashTestRating: parseCrashRating(
      dbCar.Safety_Crash_Test_Rating || dbCar.crashTestRating
    ),
    parkingSensors: mapBoolean(
      dbCar.Safety_Rear_Parking_Sensors || dbCar.parkingSensors
    ),
    parkingCamera: mapBoolean(
      dbCar.Safety_Rear_Parking_Camera || dbCar.parkingCamera
    ),
    isofix: mapBoolean(dbCar.Safety_ISOFIX_Child_Seat_Mounts || dbCar.isofix),
    hillHoldControl: mapBoolean(
      dbCar.Safety_Hill_Hold_Assist || dbCar.hillHoldControl
    ),
    tractionControl: mapBoolean(
      dbCar.Safety_Traction_Control || dbCar.tractionControl
    ),
    electronicBrakeDistribution: mapBoolean(
      dbCar.Safety_ABS_with_EBD || dbCar.electronicBrakeDistribution
    ),

    // Comfort
    airConditioning: mapBoolean(dbCar.Comfort_Air_Conditioning),
    ventilatedSeats: mapBoolean(
      dbCar.Comfort_Ventilated_Seats || dbCar.ventilatedSeats
    ),
    keylessEntry: mapBoolean(
      dbCar["Comfort_Keyless_Entry___Push-Button_Start"] || dbCar.keylessEntry
    ),
    cruiseControl: mapBoolean(
      dbCar.Comfort_Cruise_Control || dbCar.cruiseControl
    ),
    sunroof: mapBoolean(dbCar.Comfort_Sunroof_Type || dbCar.sunroof),
    heatedSeats: mapBoolean(dbCar.Comfort_Heated_Seats || dbCar.heatedSeats),
    lumbarSupport: mapBoolean(
      dbCar.Comfort_Lumbar_Support || dbCar.lumbarSupport
    ),
    adjustableHeadrest: mapBoolean(
      dbCar.Comfort_Adjustable_Headrest || dbCar.adjustableHeadrest
    ),
    rearArmrest: mapBoolean(dbCar.Comfort_Rear_Armrest || dbCar.rearArmrest),
    cupHolders: dbCar.Comfort_Cup_Holders || dbCar.cupHolders || 0,
    powerWindows: mapBoolean(dbCar.Comfort_Power_Windows || dbCar.powerWindows),
    centralLocking: mapBoolean(
      dbCar.Comfort_Central_Locking || dbCar.centralLocking
    ),

    // Infotainment
    touchscreenSize:
      dbCar.Infotainment_Touchscreen_Size_inches || dbCar.touchscreenSize || 0,
    carPlayAndroidAuto: mapBoolean(
      dbCar["Infotainment_Apple_CarPlay___Android_Auto"] ||
        dbCar.carPlayAndroidAuto
    ),
    speakers: parseSpeakerCount(
      dbCar["Infotainment_Speaker_Count_&_Brand"] || dbCar.speakers
    ),
    digitalCluster: mapBoolean(
      dbCar.Infotainment_Digital_Instrument_Cluster || dbCar.digitalCluster
    ),
    connectedTech: mapBoolean(
      dbCar.Infotainment_Connected_Car_Tech || dbCar.connectedTech
    ),
    wirelessCharging: mapBoolean(
      dbCar.Infotainment_Wireless_Charging || dbCar.wirelessCharging
    ),
    usbPorts: dbCar.Infotainment_USB_Ports || dbCar.usbPorts || 0,
    bluetoothConnectivity: mapBoolean(
      dbCar.Infotainment_Bluetooth || dbCar.bluetoothConnectivity
    ),

    // Practicality
    bootSpace: dbCar.Practicality_Boot_Space_litres || dbCar.bootSpace || 0,
    foldableSeats: mapBoolean(
      dbCar.Practicality_Foldable_Rear_Seats || dbCar.foldableSeats
    ),
    roofRails: mapBoolean(dbCar.Practicality_Roof_Rails || dbCar.roofRails),
    spareWheel: mapSpareWheelType(
      dbCar.Practicality_Spare_Wheel_Type || dbCar.spareWheel
    ),

    // Exterior
    wheelSize: parseWheelSize(dbCar.Exterior_Wheel_Type || dbCar.wheelSize),
    ledHeadlights: mapBoolean(
      dbCar.Exterior_LED_Headlamps || dbCar.ledHeadlights
    ),
    drl: mapBoolean(dbCar.Exterior_LED_DRLs || dbCar.drl),
    fogLamps: mapBoolean(dbCar.Exterior_Fog_Lamps || dbCar.fogLamps),
    autoFoldingMirrors: mapBoolean(
      dbCar["Exterior_Auto-Folding_ORVMs"] || dbCar.autoFoldingMirrors
    ),
    alloyWheels: mapBoolean(dbCar.Exterior_Alloy_Wheels || dbCar.alloyWheels),

    // ADAS
    adaptiveCruise: mapBoolean(
      dbCar.ADAS_Adaptive_Cruise_Control || dbCar.adaptiveCruise
    ),
    laneKeepAssist: mapBoolean(
      dbCar.ADAS_Lane_Keep_Assist || dbCar.laneKeepAssist
    ),
    collisionWarning: mapBoolean(
      dbCar.ADAS_Forward_Collision_Warning || dbCar.collisionWarning
    ),
    automaticEmergencyBraking: mapBoolean(
      dbCar.ADAS_Autonomous_Emergency_Braking_AEB ||
        dbCar.automaticEmergencyBraking
    ),
    blindSpotMonitor: mapBoolean(
      dbCar.ADAS_Blind_Spot_Monitoring || dbCar.blindSpotMonitor
    ),
    rearCrossTrafficAlert: mapBoolean(
      dbCar["ADAS_Rear_Cross-Traffic_Alert"] || dbCar.rearCrossTrafficAlert
    ),
    driverAttentionAlert: mapBoolean(
      dbCar.ADAS_Driver_Drowsiness_Detection || dbCar.driverAttentionAlert
    ),

    // Ownership
    warranty: dbCar.Ownership_Warranty || dbCar.warranty || "",
    serviceInterval: parseServiceInterval(
      dbCar.Ownership_Service_Interval || dbCar.serviceInterval
    ),
    roadsideAssistance: mapBoolean(
      dbCar.Ownership_Roadside_Assistance || dbCar.roadsideAssistance
    ),

    // Additional UI fields
    images: dbCar.Image_URL ? [dbCar.Image_URL] : dbCar.images || [],
    rating: dbCar.rating,
    reviewCount: dbCar.reviewCount,
  };
}

// Helper functions

function mapBoolean(value: any): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const lower = value.toLowerCase();
    return lower === "yes" || lower === "true" || lower === "available";
  }
  return false;
}

function mapTurboNA(value: any): "Turbo" | "NA" {
  if (!value) return "NA";
  const str = String(value).toLowerCase();
  return str.includes("turbo") ? "Turbo" : "NA";
}

function mapTransmissionType(
  value: any
): "Manual" | "Automatic" | "CVT" | "DCT" {
  if (!value) return "Manual";
  const str = String(value).toLowerCase();
  if (str.includes("cvt")) return "CVT";
  if (str.includes("dct")) return "DCT";
  if (str.includes("automatic") || str.includes("auto")) return "Automatic";
  return "Manual";
}

function mapDriveType(value: any): "FWD" | "AWD" | "4WD" | "RWD" {
  if (!value) return "FWD";
  const str = String(value).toUpperCase();
  if (str.includes("4WD") || str === "4WD") return "4WD";
  if (str.includes("AWD") || str === "AWD") return "AWD";
  if (str.includes("RWD") || str === "RWD") return "RWD";
  return "FWD";
}

function parseGearCount(value: any): number {
  if (typeof value === "number") return value;
  if (!value) return 5;
  const match = String(value).match(/(\d+)/);
  return match ? parseInt(match[1]) : 5;
}

function parseCrashRating(value: any): number {
  if (typeof value === "number") return value;
  if (!value) return 0;
  const match = String(value).match(/(\d+)/);
  return match ? parseInt(match[1]) : 0;
}

function parseSpeakerCount(value: any): number {
  if (typeof value === "number") return value;
  if (!value) return 0;
  const match = String(value).match(/(\d+)/);
  return match ? parseInt(match[1]) : 0;
}

function parseWheelSize(value: any): number {
  if (typeof value === "number") return value;
  if (!value) return 0;
  const match = String(value).match(/(\d+)/);
  return match ? parseInt(match[1]) : 0;
}

function parseServiceInterval(value: any): number {
  if (typeof value === "number") return value;
  if (!value) return 10000;
  const match = String(value).match(/(\d+)/);
  return match ? parseInt(match[1]) * 1000 : 10000; // Convert to km
}

function mapSpareWheelType(value: any): "Full" | "Stepney" | "None" {
  if (!value) return "None";
  const str = String(value).toLowerCase();
  if (str.includes("full")) return "Full";
  if (str.includes("stepney") || str.includes("steel")) return "Stepney";
  if (str.includes("none") || str === "no") return "None";
  return "Stepney";
}

/**
 * Map array of database cars to app cars
 */
export function mapDatabaseCarsToAppCars(dbCars: any[]): Car[] {
  return dbCars.map(mapDatabaseCarToAppCar).filter((car) => {
    // Filter out invalid cars
    return (
      car.brand && car.model && car.priceInLakhs > 0 && car.mileageARAI > 0
    );
  });
}
