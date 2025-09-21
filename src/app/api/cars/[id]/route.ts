import { NextRequest, NextResponse } from "next/server";
import { getDatabase, COLLECTIONS } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { Car } from "@/types/car";

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/cars/[id] - Get individual car details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid car ID" }, { status: 400 });
    }

    const db = await getDatabase();

    // Find the specific car
    const car = await db.collection(COLLECTIONS.CARS).findOne({
      _id: new ObjectId(id),
    });

    if (!car) {
      return NextResponse.json({ error: "Car not found" }, { status: 404 });
    }

    // Transform MongoDB document to Car object (same logic as cars route)
    const transformedCar: Car = {
      _id: car._id.toString(),

      // Identification
      brand: car.Identification_Brand || car.brand || "Unknown",
      model: car.Identification_Model || car.model || "Unknown",
      variant: car.Identification_Variant || car.variant || "Unknown",
      year: car.Identification_Year_of_Manufacture || car.year || 2024,
      bodyType: car.Identification_Body_Type || car.bodyType || "Unknown",
      segment: car.Identification_Segment || car.segment || "Unknown",

      // Pricing
      priceInLakhs: car.Price_Lakhs || car.priceInLakhs || 0,

      // Dimensions
      length: car.Dimensions_Length_mm || car.length || 4000,
      width: car.Dimensions_Width_mm || car.width || 1700,
      height: car.Dimensions_Height_mm || car.height || 1500,
      wheelbase: car.Dimensions_Wheelbase_mm || car.wheelbase || 2500,
      groundClearance:
        car.Dimensions_Ground_Clearance_mm || car.groundClearance || 165,
      weight: car.Dimensions_Kerb_Weight_kg || car.weight || 1200,
      turningRadius: car.Dimensions_Turning_Radius_m || car.turningRadius || 5,
      fuelTank: car.Dimensions_Fuel_Tank_Capacity_litres || car.fuelTank || 45,

      // Engine
      displacement:
        car.Engine_Engine_Displacement_cc || car.displacement || 1000,
      cylinders: car.Engine_Cylinder_Count || car.cylinders || 3,
      turboNA: (car.Engine_Turbocharged_or_Naturally_Aspirated ===
      "Turbocharged"
        ? "Turbo"
        : "NA") as "Turbo" | "NA",
      powerBhp: car.Engine_Power_bhp || car.powerBhp || 60,
      torqueNm: car.Engine_Torque_Nm || car.torqueNm || 90,

      // Transmission
      transmissionType:
        car.Transmission_Transmission_Type || car.transmissionType || "Manual",
      gearCount: parseInt(
        car.Transmission_Gear_Count?.toString().replace(/[^0-9]/g, "") || "5"
      ),
      driveType: car.Transmission_Drive_Type || car.driveType || "FWD",

      // Performance
      acceleration0to100:
        car.Performance_0_to_100_kmph_secs || car.acceleration0to100 || 12,
      topSpeed: car.Performance_Top_Speed_kmph || car.topSpeed || 180,

      // Fuel & Emissions
      mileageARAI: car.Fuel_Mileage_ARAI_kmpl || car.mileageARAI || 15,
      emissionStandard:
        car.Fuel_Emission_Standard || car.emissionStandard || "BS6",
      adBlueSystem:
        car.Fuel_Ad_Blue_System === "Yes" || car.adBlueSystem || false,

      // Safety
      airbags: parseInt(
        car.Safety_Airbags?.toString().replace(/[^0-9]/g, "") || "2"
      ),
      abs: car.Safety_ABS === "Yes" || car.abs || true,
      esc: car.Safety_ESC === "Yes" || car.esc || true,
      crashTestRating: parseFloat(
        car.Safety_Crash_Test_Rating || car.crashTestRating || "4"
      ),
      parkingSensors:
        car.Safety_Parking_Sensors === "Yes" || car.parkingSensors || false,
      parkingCamera:
        car.Safety_Parking_Camera === "Yes" || car.parkingCamera || false,
      isofix: car.Safety_ISOFIX === "Yes" || car.isofix || false,
      hillHoldControl:
        car.Safety_Hill_Hold_Control === "Yes" || car.hillHoldControl || false,
      tractionControl:
        car.Safety_Traction_Control === "Yes" || car.tractionControl || false,
      electronicBrakeDistribution:
        car.Safety_EBD === "Yes" || car.electronicBrakeDistribution || true,

      // Comfort
      airConditioning: car.Comfort_AC === "Yes" || car.airConditioning || true,
      ventilatedSeats:
        car.Comfort_Ventilated_Seats === "Yes" || car.ventilatedSeats || false,
      keylessEntry:
        car.Comfort_Keyless_Entry === "Yes" || car.keylessEntry || false,
      cruiseControl:
        car.Comfort_Cruise_Control === "Yes" || car.cruiseControl || false,
      sunroof: car.Comfort_Sunroof === "Yes" || car.sunroof || false,
      heatedSeats:
        car.Comfort_Heated_Seats === "Yes" || car.heatedSeats || false,
      lumbarSupport:
        car.Comfort_Lumbar_Support === "Yes" || car.lumbarSupport || false,
      adjustableHeadrest:
        car.Comfort_Adjustable_Headrest === "Yes" ||
        car.adjustableHeadrest ||
        true,
      rearArmrest:
        car.Comfort_Rear_Armrest === "Yes" || car.rearArmrest || false,
      cupHolders: parseInt(
        car.Comfort_Cup_Holders?.toString().replace(/[^0-9]/g, "") || "2"
      ),
      powerWindows:
        car.Comfort_Power_Windows === "Yes" || car.powerWindows || true,
      centralLocking:
        car.Comfort_Central_Locking === "Yes" || car.centralLocking || true,

      // Infotainment
      touchscreenSize: parseInt(
        car.Infotainment_Touchscreen_Size?.toString().replace(/[^0-9]/g, "") ||
          "7"
      ),
      carPlayAndroidAuto:
        car.Infotainment_Apple_CarPlay_Android_Auto === "Yes" ||
        car.carPlayAndroidAuto ||
        false,
      speakers: parseInt(
        car.Infotainment_Speakers?.toString().replace(/[^0-9]/g, "") || "4"
      ),
      digitalCluster:
        car.Infotainment_Digital_Instrument_Cluster === "Yes" ||
        car.digitalCluster ||
        false,
      connectedTech:
        car.Infotainment_Connected_Tech === "Yes" || car.connectedTech || false,
      wirelessCharging:
        car.Infotainment_Wireless_Charging === "Yes" ||
        car.wirelessCharging ||
        false,
      usbPorts: parseInt(
        car.Infotainment_USB_Ports?.toString().replace(/[^0-9]/g, "") || "2"
      ),
      bluetoothConnectivity:
        car.Infotainment_Bluetooth_Connectivity === "Yes" ||
        car.bluetoothConnectivity ||
        true,

      // Practicality
      bootSpace: parseInt(
        car.Practicality_Boot_Space_litres?.toString().replace(/[^0-9]/g, "") ||
          "350"
      ),
      foldableSeats:
        car.Practicality_Foldable_Seats === "Yes" || car.foldableSeats || true,
      roofRails:
        car.Practicality_Roof_Rails === "Yes" || car.roofRails || false,
      spareWheel:
        car.Practicality_Spare_Wheel_Type === "Alloy"
          ? "Full"
          : ((car.spareWheel || "Full") as "Full" | "Stepney" | "None"),

      // Exterior
      wheelSize: parseInt(
        car.Exterior_Wheel_Type?.toString().replace(/[^0-9]/g, "") || "15"
      ),
      ledHeadlights:
        car.Exterior_LED_Headlamps === "Yes" || car.ledHeadlights || false,
      drl: car.Exterior_LED_DRLs === "Yes" || car.drl || false,
      fogLamps: car.Exterior_Fog_Lamps === "Yes" || car.fogLamps || false,
      autoFoldingMirrors:
        car["Exterior_Auto-Folding_ORVMs"] === "Yes" ||
        car.autoFoldingMirrors ||
        false,
      alloyWheels:
        car.Exterior_Wheel_Type?.includes("Alloy") || car.alloyWheels || false,

      // ADAS
      adaptiveCruise:
        car.ADAS_Adaptive_Cruise_Control === "Yes" ||
        car.adaptiveCruise ||
        false,
      laneKeepAssist:
        car.ADAS_Lane_Keep_Assist === "Yes" || car.laneKeepAssist || false,
      collisionWarning:
        car.ADAS_Forward_Collision_Warning === "Yes" ||
        car.collisionWarning ||
        false,
      automaticEmergencyBraking:
        car.ADAS_Autonomous_Emergency_Braking_AEB === "Yes" ||
        car.automaticEmergencyBraking ||
        false,
      blindSpotMonitor:
        car.ADAS_Blind_Spot_Monitoring === "Yes" ||
        car.blindSpotMonitor ||
        false,
      rearCrossTrafficAlert:
        car["ADAS_Rear_Cross-Traffic_Alert"] === "Yes" ||
        car.rearCrossTrafficAlert ||
        false,
      driverAttentionAlert:
        car.ADAS_Driver_Drowsiness_Detection === "Yes" ||
        car.driverAttentionAlert ||
        false,

      // Ownership
      warranty: car.Ownership_Warranty || car.warranty || "3 Years/1,00,000 km",
      serviceInterval: parseInt(
        car.Ownership_Service_Interval?.toString().replace(/[^0-9]/g, "") ||
          "10000"
      ),
      roadsideAssistance:
        car.Ownership_Roadside_Assistance !== "No" ||
        car.roadsideAssistance ||
        true,

      // Additional fields
      images: car.images || [],
      rating: car.rating || Math.random() * 2 + 3, // Random rating between 3-5
      reviewCount: car.reviewCount || Math.floor(Math.random() * 100) + 10,
    };

    return NextResponse.json({ car: transformedCar });
  } catch (error) {
    console.error("Error fetching car details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
