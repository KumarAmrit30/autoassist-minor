import { NextRequest, NextResponse } from "next/server";
import { getDatabase, COLLECTIONS } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { Car } from "@/types/car";

// GET /api/cars/[id] - Get individual car details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

      // Identification - MongoDB uses spaces in field names
      brand: car["Identification Brand"] || car.Identification_Brand || car.brand || car.make || "Unknown",
      model: car["Identification Model"] || car.Identification_Model || car.model || "Unknown",
      variant: car["Identification Variant"] || car.Identification_Variant || car.variant || "Unknown",
      year: car["Identification Year"] || car["Identification Year of Manufacture"] || car.Identification_Year_of_Manufacture || car.year || 2024,
      bodyType: car["Identification Body Type"] || car.Identification_Body_Type || car.bodyType || car.body_type || "Unknown",
      segment: car["Identification Segment"] || car.Identification_Segment || car.segment || "Unknown",

      // Pricing - Convert from rupees to lakhs
      priceInLakhs: car["Pricing Delhi Ex Showroom Price"] 
        ? parseFloat(car["Pricing Delhi Ex Showroom Price"]) / 100000 
        : (car.Price_Lakhs || car.priceInLakhs || car.price_lakhs || 0),

      // Dimensions
      length: car["Dimensions Length"] || car.Dimensions_Length_mm || car.length || 4000,
      width: car["Dimensions Width"] || car.Dimensions_Width_mm || car.width || 1700,
      height: car["Dimensions Height"] || car.Dimensions_Height_mm || car.height || 1500,
      wheelbase: car["Dimensions Wheelbase"] || car.Dimensions_Wheelbase_mm || car.wheelbase || 2500,
      groundClearance:
        car["Dimensions Ground Clearance"] || car.Dimensions_Ground_Clearance_mm || car.groundClearance || car.ground_clearance || 165,
      weight: car["Dimensions Weight Kg"] || car.Dimensions_Kerb_Weight_kg || car.weight || 1200,
      turningRadius: car["Dimensions Turning Radius"] || car.Dimensions_Turning_Radius_m || car.turningRadius || car.turning_radius || 5,
      fuelTank: car["Efficiency Tank Capacity"] || car.Dimensions_Fuel_Tank_Capacity_litres || car.fuelTank || car.fuel_tank || 45,

      // Engine
      displacement:
        car["Engine Cc"] || car.Engine_Engine_Displacement_cc || car.displacement || 1000,
      cylinders: car["Engine Cylinders"] || car.Engine_Cylinder_Count || car.cylinders || 3,
      turboNA: (car["Engine Turbo"] === true || car.Engine_Turbocharged_or_Naturally_Aspirated === "Turbocharged"
        ? "Turbo"
        : "NA") as "Turbo" | "NA",
      powerBhp: car["Engine Bhp"] || car.Engine_Power_bhp || car.powerBhp || car.power_bhp || 60,
      torqueNm: car["Engine Torque"] || car.Engine_Torque_Nm || car.torqueNm || car.torque_nm || 90,

      // Transmission
      transmissionType:
        car["Engine Transmission"] || car.Transmission_Transmission_Type || car.transmissionType || car.transmission_type || "Manual",
      gearCount: parseInt(
        (car["Engine Gears"] || car.Transmission_Gear_Count || car.gearCount)?.toString().replace(/[^0-9]/g, "") || "5"
      ),
      driveType: car["Engine Drive"] || car.Transmission_Drive_Type || car.driveType || car.drive_type || "FWD",

      // Performance
      acceleration0to100:
        car["Engine 0 100 Sec"] || car.Performance_0_to_100_kmph_secs ||
        car.acceleration0to100 || car.acceleration_0_to_100 || 12,
      topSpeed: car["Engine Top Speed"] || car.Performance_Top_Speed_kmph || car.topSpeed || car.top_speed || 180,

      // Fuel & Emissions
      mileageARAI:
        car["Efficiency Mileage Arai"] || car["Efficiency Mileage City"] || car["Efficiency Mileage Highway"] ||
        car.Fuel_Mileage_ARAI_kmpl || car.mileageARAI || car.mileage || 15,
      emissionStandard:
        car["Efficiency Emission Standard"] || car.Fuel_Emission_Standard ||
        car.emissionStandard || car.emission_standard || "BS6",
      adBlueSystem:
        car["Fuel Ad Blue System"] === "Yes" || car.Fuel_Ad_Blue_System === "Yes" ||
        car.adBlueSystem || false,

      // Safety
      airbags: parseInt(
        (car["Safety Airbags"] || car.Safety_Airbags || car.airbags || 2)?.toString().replace(/[^0-9]/g, "") || "2"
      ),
      abs: car["Safety Abs"] === true || car.Safety_ABS === "Yes" || car.abs !== false,
      esc: car["Safety Esp"] === true || car.Safety_ESC === "Yes" || car.esc === true || false,
      crashTestRating: parseFloat(
        (car["Safety Ncap Stars"] || car.Safety_Crash_Test_Rating || car.crashTestRating || car.crash_rating || 4)?.toString().replace(/[^0-9.]/g, "") || "4"
      ),
      parkingSensors:
        car["Safety Parking Sensors"] === true || car.Safety_Parking_Sensors === "Yes" ||
        car.parkingSensors === true || false,
      parkingCamera:
        car["Safety Parking Camera"] === true || car.Safety_Parking_Camera === "Yes" || 
        car.parkingCamera === true || false,
      isofix: car["Safety Isofix"] === true || car.Safety_ISOFIX === "Yes" || 
        car.isofix === true || false,
      hillHoldControl:
        car["Safety Hill Hold"] === true || car.Safety_Hill_Hold_Control === "Yes" || 
        car.hillHoldControl === true || false,
      tractionControl:
        car["Safety Traction Control"] === true || car.Safety_Traction_Control === "Yes" || 
        car.tractionControl === true || false,
      electronicBrakeDistribution:
        car["Safety EBD"] === true || car.Safety_EBD === "Yes" ||
        car.electronicBrakeDistribution !== false || true,

      // Comfort
      airConditioning:
        car["Comfort AC"] !== "No" || car.Comfort_AC === "Yes" || 
        car.airConditioning !== false || true,
      ventilatedSeats:
        car["Features Ventilated Seats"] === true || car.Comfort_Ventilated_Seats === "Yes" || 
        car.ventilatedSeats === true || false,
      keylessEntry:
        car["Features Keyless Entry"] === true || car.Comfort_Keyless_Entry === "Yes" ||
        car.keylessEntry === true || false,
      cruiseControl:
        car["Features Cruise Control"] === true || car.Comfort_Cruise_Control === "Yes" || 
        car.cruiseControl === true || false,
      sunroof: car["Features Sunroof"] === true || car.Comfort_Sunroof === "Yes" || 
        car.sunroof === true || false,
      heatedSeats:
        car["Comfort Heated Seats"] === true || car.Comfort_Heated_Seats === "Yes" || 
        car.heatedSeats === true || false,
      lumbarSupport:
        car["Comfort Lumbar Support"] === true || car.Comfort_Lumbar_Support === "Yes" || 
        car.lumbarSupport !== false,
      adjustableHeadrest:
        car["Comfort Adjustable Headrest"] === true || car.Comfort_Adjustable_Headrest === "Yes" ||
        car.adjustableHeadrest !== false || true,
      rearArmrest:
        car["Comfort Rear Armrest"] === true || car.Comfort_Rear_Armrest === "Yes" || 
        car.rearArmrest !== false,
      cupHolders: parseInt(
        (car["Comfort Cup Holders"] || car.Comfort_Cup_Holders || car.cupHolders || 2)?.toString().replace(/[^0-9]/g, "") || "2"
      ),
      powerWindows:
        car["Comfort Power Windows"] === true || car.Comfort_Power_Windows === "Yes" || 
        car.powerWindows !== false || true,
      centralLocking:
        car["Comfort Central Locking"] === true || car.Comfort_Central_Locking === "Yes" || 
        car.centralLocking !== false || true,

      // Infotainment
      touchscreenSize: parseInt(
        (car["Features Touchscreen Inch"] || car.Infotainment_Touchscreen_Size || 
         car.touchscreenSize || car.touchscreen_size || 7)?.toString().replace(/[^0-9]/g, "") || "7"
      ),
      carPlayAndroidAuto:
        car["Features Apple CarPlay"] === true || car.Infotainment_Apple_CarPlay_Android_Auto === "Yes" ||
        car.carPlayAndroidAuto === true || car.apple_carplay === true || false,
      speakers: parseInt(
        (car["Infotainment Speakers"] || car.Infotainment_Speakers ||
         car.speakers || 4)?.toString().replace(/[^0-9]/g, "") || "4"
      ),
      digitalCluster:
        car["Infotainment Digital Instrument Cluster"] === true || car.Infotainment_Digital_Instrument_Cluster === "Yes" ||
        car.digitalCluster === true || car.digital_cluster === true || false,
      connectedTech:
        car["Features Connected Tech"] === true || car.Infotainment_Connected_Tech === "Yes" ||
        car.connectedTech === true || car.connected_tech === true || false,
      wirelessCharging:
        car["Features Wireless Charging"] === true || car.Infotainment_Wireless_Charging === "Yes" ||
        car.wirelessCharging === true || car.wireless_charging === true || false,
      usbPorts: parseInt(
        (car["Infotainment USB Ports"] || car.Infotainment_USB_Ports || 
         car.usbPorts || car.usb_ports || 2)?.toString().replace(/[^0-9]/g, "") || "2"
      ),
      bluetoothConnectivity:
        car["Infotainment Bluetooth"] === true || car.Infotainment_Bluetooth_Connectivity === "Yes" ||
        car.bluetoothConnectivity !== false || true,

      // Practicality
      bootSpace: parseInt(
        (car["Dimensions Boot Liters"] || car.Practicality_Boot_Space_litres || 
         car.bootSpace || car.boot_space || 350)?.toString().replace(/[^0-9]/g, "") || "350"
      ),
      foldableSeats:
        car["Practicality Foldable Seats"] === true || car.Practicality_Foldable_Seats === "Yes" ||
        car.foldableSeats !== false || true,
      roofRails:
        car["Practicality Roof Rails"] === true || car.Practicality_Roof_Rails === "Yes" || 
        car.roofRails === true || false,
      spareWheel:
        car["Practicality Spare Wheel Type"] === "Alloy" || car.Practicality_Spare_Wheel_Type === "Alloy"
          ? "Full"
          : ((car.spareWheel || "Full") as "Full" | "Stepney" | "None"),

      // Exterior
      wheelSize: parseInt(
        (car["Exterior Wheel Size"] || car.Exterior_Wheel_Type || 
         car.wheelSize || car.wheel_size || 15)?.toString().replace(/[^0-9]/g, "") || "15"
      ),
      ledHeadlights:
        car["Features Led Lights"] === true || car.Exterior_LED_Headlamps === "Yes" || 
        car.ledHeadlights === true || false,
      drl: car["Exterior LED DRLs"] === true || car.Exterior_LED_DRLs === "Yes" || 
        car.drl === true || false,
      fogLamps: car["Exterior Fog Lamps"] === true || car.Exterior_Fog_Lamps === "Yes" || 
        car.fogLamps === true || false,
      autoFoldingMirrors:
        car["Exterior Auto-Folding ORVMs"] === true || car["Exterior_Auto-Folding_ORVMs"] === "Yes" ||
        car.autoFoldingMirrors === true || false,
      alloyWheels:
        car["Features Alloy Wheels"] === true || car.Exterior_Wheel_Type?.includes("Alloy") || 
        car.alloyWheels === true || car.alloy_wheels === true || false,

      // ADAS
      adaptiveCruise:
        car["Safety Adas Level 2"] === true || car.ADAS_Adaptive_Cruise_Control === "Yes" ||
        car.adaptiveCruise === true || car.adaptive_cruise === true || false,
      laneKeepAssist:
        car["ADAS Lane Keep Assist"] === true || car.ADAS_Lane_Keep_Assist === "Yes" || 
        car.laneKeepAssist === true || car.lane_keep_assist === true || false,
      collisionWarning:
        car["ADAS Forward Collision Warning"] === true || car.ADAS_Forward_Collision_Warning === "Yes" ||
        car.collisionWarning === true || car.collision_warning === true || false,
      automaticEmergencyBraking:
        car["ADAS Autonomous Emergency Braking"] === true || car.ADAS_Autonomous_Emergency_Braking_AEB === "Yes" ||
        car.automaticEmergencyBraking === true || car.automatic_emergency_braking === true || false,
      blindSpotMonitor:
        car["ADAS Blind Spot Monitoring"] === true || car.ADAS_Blind_Spot_Monitoring === "Yes" ||
        car.blindSpotMonitor === true || car.blind_spot === true || false,
      rearCrossTrafficAlert:
        car["ADAS Rear Cross-Traffic Alert"] === true || car["ADAS_Rear_Cross-Traffic_Alert"] === "Yes" ||
        car.rearCrossTrafficAlert === true || false,
      driverAttentionAlert:
        car["ADAS Driver Drowsiness Detection"] === true || car.ADAS_Driver_Drowsiness_Detection === "Yes" ||
        car.driverAttentionAlert === true || false,

      // Ownership
      warranty: car["Warranty Years"] && car["Warranty Km"] 
        ? `${car["Warranty Years"]} Years/${car["Warranty Km"]?.toLocaleString('en-IN')} km`
        : (car.Ownership_Warranty || car.warranty || "3 Years/1,00,000 km"),
      serviceInterval: parseInt(
        (car["Warranty Service Km"] || car.Ownership_Service_Interval || 
         car.serviceInterval || car.service_interval_km || 10000)?.toString().replace(/[^0-9]/g, "") || "10000"
      ),
      roadsideAssistance:
        car["Ownership Roadside Assistance"] !== "No" || car.Ownership_Roadside_Assistance !== "No" ||
        car.roadsideAssistance !== false || true,

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
