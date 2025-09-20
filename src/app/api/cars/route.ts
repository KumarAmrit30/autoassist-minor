import { NextRequest, NextResponse } from "next/server";
import { getDatabase, COLLECTIONS } from "@/lib/mongodb";
import { Car } from "@/types/car";

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
        car["Performance_Acceleration_0-100_km_h_sec"] ||
        car.acceleration0to100 ||
        12,
      topSpeed: car.Performance_Top_Speed_km_h || car.topSpeed || 160,

      // Fuel & Emissions
      mileageARAI:
        car.Fuel_and_Emissions_Mileage_ARAI_kmpl || car.mileageARAI || 20,
      emissionStandard:
        car.Fuel_and_Emissions_Emission_Standard ||
        car.emissionStandard ||
        "BS6",
      adBlueSystem:
        car.Fuel_and_Emissions_AdBlue_System === "Yes" ||
        car.adBlueSystem ||
        false,

      // Safety
      airbags: car.Safety_Airbags_Count || car.airbags || 2,
      abs: car.Safety_ABS_with_EBD === "Yes" || car.abs || true,
      esc:
        car.Safety_Electronic_Stability_Control_ESC === "Yes" ||
        car.esc ||
        false,
      crashTestRating: parseInt(
        car.Safety_Crash_Test_Rating?.toString().replace(/[^0-9]/g, "") || "4"
      ),
      parkingSensors:
        car.Safety_Rear_Parking_Sensors === "Yes" ||
        car.parkingSensors ||
        false,
      parkingCamera:
        car.Safety_Rear_Parking_Camera === "Yes" || car.parkingCamera || false,
      isofix:
        car.Safety_ISOFIX_Child_Seat_Mounts === "Yes" || car.isofix || false,
      hillHoldControl:
        car.Safety_Hill_Hold_Assist === "Yes" || car.hillHoldControl || false,
      tractionControl:
        car.Safety_Traction_Control === "Yes" || car.tractionControl || false,
      electronicBrakeDistribution:
        car.Safety_ABS_with_EBD === "Yes" ||
        car.electronicBrakeDistribution ||
        true,

      // Comfort
      airConditioning:
        car.Comfort_Air_Conditioning !== "No" || car.airConditioning || true,
      ventilatedSeats:
        car.Comfort_Ventilated_Seats === "Yes" || car.ventilatedSeats || false,
      keylessEntry:
        car["Comfort_Keyless_Entry___Push-Button_Start"] === "Yes" ||
        car.keylessEntry ||
        false,
      cruiseControl:
        car.Comfort_Cruise_Control === "Yes" || car.cruiseControl || false,
      sunroof: car.Comfort_Sunroof_Type !== "No" || car.sunroof || false,
      heatedSeats:
        car.Comfort_Heated_Seats === "Yes" || car.heatedSeats || false,
      lumbarSupport: car.lumbarSupport !== false,
      adjustableHeadrest: car.adjustableHeadrest !== false,
      rearArmrest: car.rearArmrest !== false,
      cupHolders: car.cupHolders || 2,
      powerWindows: car.powerWindows !== false,
      centralLocking: car.centralLocking !== false,

      // Infotainment
      touchscreenSize:
        car.Infotainment_Touchscreen_Size_inches || car.touchscreenSize || 7,
      carPlayAndroidAuto:
        car["Infotainment_Apple_CarPlay___Android_Auto"]?.includes("Yes") ||
        car.carPlayAndroidAuto ||
        false,
      speakers: parseInt(
        car["Infotainment_Speaker_Count_&_Brand"]
          ?.toString()
          .replace(/[^0-9]/g, "") || "4"
      ),
      digitalCluster:
        car.Infotainment_Digital_Instrument_Cluster === "Yes" ||
        car.digitalCluster ||
        false,
      connectedTech:
        car.Infotainment_Connected_Car_Tech === "Yes" ||
        car.connectedTech ||
        false,
      wirelessCharging:
        car.Infotainment_Wireless_Charging === "Yes" ||
        car.wirelessCharging ||
        false,
      usbPorts: car.usbPorts || 2,
      bluetoothConnectivity: car.bluetoothConnectivity !== false,

      // Practicality
      bootSpace: car.Practicality_Boot_Space_litres || car.bootSpace || 300,
      foldableSeats:
        car.Practicality_Foldable_Rear_Seats === "Yes" ||
        car.foldableSeats ||
        true,
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

      // UI state
      isFavorite: false,
      isInWishlist: false,
      rating: car.rating || 4.0,
      reviewCount: car.reviewCount || Math.floor(Math.random() * 5000),
      images: car.images || ["/api/placeholder/400/300"],
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
