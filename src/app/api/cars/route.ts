import { NextRequest, NextResponse } from "next/server";
import { getDatabase, COLLECTIONS } from "@/lib/mongodb";
import { Car } from "@/types/car";
import { generateCarImageUrls } from "@/lib/car-images";

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase();
    const { searchParams } = new URL(request.url);

    // Get query parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const search = searchParams.get("search") || "";
    const brand = searchParams.get("brand") || "";
    const segment = searchParams.get("segment") || "";
    const priceMin = parseFloat(searchParams.get("priceMin") || "0");
    const priceMax = parseFloat(searchParams.get("priceMax") || "1000");

    // Build filter object
    const filter: Record<string, unknown> = {};

    if (search) {
      filter.$or = [
        { brand: { $regex: search, $options: "i" } },
        { model: { $regex: search, $options: "i" } },
        { variant: { $regex: search, $options: "i" } },
      ];
    }

    if (brand) {
      filter.brand = { $regex: brand, $options: "i" };
    }

    if (segment) {
      filter.segment = { $regex: segment, $options: "i" };
    }

    if (priceMin > 0 || priceMax < 1000) {
      filter.priceInLakhs = {
        $gte: priceMin,
        $lte: priceMax,
      };
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Get cars with filters and pagination
    const cars = await db
      .collection(COLLECTIONS.CARS)
      .find(filter)
      .sort({ priceInLakhs: 1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Get total count for pagination
    const total = await db.collection(COLLECTIONS.CARS).countDocuments(filter);

    // Transform MongoDB documents to Car objects
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transformedCars: Car[] = cars.map((car: any) => ({
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
        car["Engine 0 100 Sec"] || car["Performance_Acceleration_0-100_km_h_sec"] ||
        car.acceleration0to100 || car.acceleration_0_to_100 || 12,
      topSpeed: car["Engine Top Speed"] || car.Performance_Top_Speed_km_h || car.topSpeed || car.top_speed || 160,

      // Fuel & Emissions
      mileageARAI:
        car["Efficiency Mileage Arai"] || car["Efficiency Mileage City"] || car["Efficiency Mileage Highway"] ||
        car.Fuel_and_Emissions_Mileage_ARAI_kmpl || car.mileageARAI || car.mileage || 20,
      emissionStandard:
        car["Efficiency Emission Standard"] || car.Fuel_and_Emissions_Emission_Standard ||
        car.emissionStandard || car.emission_standard || "BS6",
      adBlueSystem:
        car["Fuel Ad Blue System"] === "Yes" || car.Fuel_and_Emissions_AdBlue_System === "Yes" ||
        car.adBlueSystem || false,

      // Safety
      airbags: parseInt(
        (car["Safety Airbags"] || car.Safety_Airbags_Count || car.airbags || 2)?.toString().replace(/[^0-9]/g, "") || "2"
      ),
      abs: car["Safety Abs"] === true || car.Safety_ABS_with_EBD === "Yes" || car.abs !== false,
      esc:
        car["Safety Esp"] === true || car.Safety_Electronic_Stability_Control_ESC === "Yes" ||
        car.esc === true || false,
      crashTestRating: parseFloat(
        (car["Safety Ncap Stars"] || car.Safety_Crash_Test_Rating || car.crashTestRating || car.crash_rating || 4)?.toString().replace(/[^0-9.]/g, "") || "4"
      ),
      parkingSensors:
        car["Safety Parking Sensors"] === true || car.Safety_Rear_Parking_Sensors === "Yes" ||
        car.parkingSensors === true || false,
      parkingCamera:
        car["Safety Parking Camera"] === true || car.Safety_Rear_Parking_Camera === "Yes" || 
        car.parkingCamera === true || false,
      isofix:
        car["Safety Isofix"] === true || car.Safety_ISOFIX_Child_Seat_Mounts === "Yes" || 
        car.isofix === true || false,
      hillHoldControl:
        car["Safety Hill Hold"] === true || car.Safety_Hill_Hold_Assist === "Yes" || 
        car.hillHoldControl === true || false,
      tractionControl:
        car["Safety Traction Control"] === true || car.Safety_Traction_Control === "Yes" || 
        car.tractionControl === true || false,
      electronicBrakeDistribution:
        car["Safety EBD"] === true || car.Safety_ABS_with_EBD === "Yes" ||
        car.electronicBrakeDistribution !== false || true,

      // Comfort
      airConditioning:
        car["Comfort AC"] !== "No" || car.Comfort_Air_Conditioning !== "No" || 
        car.airConditioning !== false || true,
      ventilatedSeats:
        car["Features Ventilated Seats"] === true || car.Comfort_Ventilated_Seats === "Yes" || 
        car.ventilatedSeats === true || false,
      keylessEntry:
        car["Features Keyless Entry"] === true || car["Comfort_Keyless_Entry___Push-Button_Start"] === "Yes" ||
        car.keylessEntry === true || false,
      cruiseControl:
        car["Features Cruise Control"] === true || car.Comfort_Cruise_Control === "Yes" || 
        car.cruiseControl === true || false,
      sunroof: car["Features Sunroof"] === true || car.Comfort_Sunroof_Type !== "No" || 
        car.sunroof === true || false,
      heatedSeats:
        car["Comfort Heated Seats"] === true || car.Comfort_Heated_Seats === "Yes" || 
        car.heatedSeats === true || false,
      lumbarSupport: car["Comfort Lumbar Support"] === true || car.lumbarSupport !== false,
      adjustableHeadrest: car["Comfort Adjustable Headrest"] === true || car.adjustableHeadrest !== false,
      rearArmrest: car["Comfort Rear Armrest"] === true || car.rearArmrest !== false,
      cupHolders: parseInt((car["Comfort Cup Holders"] || car.cupHolders || 2)?.toString().replace(/[^0-9]/g, "") || "2"),
      powerWindows: car["Comfort Power Windows"] === true || car.powerWindows !== false,
      centralLocking: car["Comfort Central Locking"] === true || car.centralLocking !== false,

      // Infotainment
      touchscreenSize: parseInt(
        (car["Features Touchscreen Inch"] || car.Infotainment_Touchscreen_Size_inches || 
         car.touchscreenSize || car.touchscreen_size || 7)?.toString().replace(/[^0-9]/g, "") || "7"
      ),
      carPlayAndroidAuto:
        car["Features Apple CarPlay"] === true || car["Infotainment_Apple_CarPlay___Android_Auto"]?.includes("Yes") ||
        car.carPlayAndroidAuto === true || car.apple_carplay === true || false,
      speakers: parseInt(
        (car["Infotainment Speakers"] || car["Infotainment_Speaker_Count_&_Brand"] ||
         car.speakers || 4)?.toString().replace(/[^0-9]/g, "") || "4"
      ),
      digitalCluster:
        car["Infotainment Digital Instrument Cluster"] === true || car.Infotainment_Digital_Instrument_Cluster === "Yes" ||
        car.digitalCluster === true || car.digital_cluster === true || false,
      connectedTech:
        car["Features Connected Tech"] === true || car.Infotainment_Connected_Car_Tech === "Yes" ||
        car.connectedTech === true || car.connected_tech === true || false,
      wirelessCharging:
        car["Features Wireless Charging"] === true || car.Infotainment_Wireless_Charging === "Yes" ||
        car.wirelessCharging === true || car.wireless_charging === true || false,
      usbPorts: parseInt((car["Infotainment USB Ports"] || car.usbPorts || car.usb_ports || 2)?.toString().replace(/[^0-9]/g, "") || "2"),
      bluetoothConnectivity: car["Infotainment Bluetooth"] === true || car.bluetoothConnectivity !== false,

      // Practicality
      bootSpace: parseInt(
        (car["Dimensions Boot Liters"] || car.Practicality_Boot_Space_litres || 
         car.bootSpace || car.boot_space || 300)?.toString().replace(/[^0-9]/g, "") || "300"
      ),
      foldableSeats:
        car["Practicality Foldable Seats"] === true || car.Practicality_Foldable_Rear_Seats === "Yes" ||
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

      // UI state
      isFavorite: false,
      isInWishlist: false,
      rating: car.rating || 4.0,
      reviewCount: car.reviewCount || Math.floor(Math.random() * 5000),
      images: (() => {
        // Ensure images is always an array
        const existingImages =
          car.images || car.Image_URL || car.image_url || car.imageUrl;
        if (existingImages) {
          return Array.isArray(existingImages)
            ? existingImages
            : [existingImages];
        }
        return generateCarImageUrls();
      })(),
    }));

    return NextResponse.json({
      cars: transformedCars,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
      filters: {
        search,
        brand,
        segment,
        priceMin,
        priceMax,
      },
    });
  } catch (error) {
    console.error("Error fetching cars:", error);
    return NextResponse.json(
      { error: "Failed to fetch cars" },
      { status: 500 }
    );
  }
}
