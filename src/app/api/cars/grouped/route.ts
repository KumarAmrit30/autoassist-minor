import { NextRequest, NextResponse } from "next/server";
import { getDatabase, COLLECTIONS } from "@/lib/mongodb";
import { generateCarImageUrls } from "@/lib/car-images";

/**
 * GET /api/cars/grouped
 * 
 * Returns cars grouped by brand + model (not by variant).
 * This solves the problem of showing multiple variants as separate cars.
 * 
 * For each car model, returns:
 * - Representative variant (base/cheapest variant)
 * - Price range (min-max across all variants)
 * - Variant count
 * - All variants array (for details page)
 */
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
    const groupByModel = searchParams.get("groupByModel") !== "false"; // Default: true

    // If grouping is disabled, fall back to regular behavior
    if (!groupByModel) {
      return NextResponse.redirect(new URL("/api/cars", request.url));
    }

    // Build match stage for aggregation
    const matchStage: Record<string, unknown> = {};

    if (search) {
      matchStage.$or = [
        { "Identification Brand": { $regex: search, $options: "i" } },
        { "Identification Model": { $regex: search, $options: "i" } },
        { "Identification Variant": { $regex: search, $options: "i" } },
      ];
    }

    if (brand) {
      matchStage["Identification Brand"] = { $regex: brand, $options: "i" };
    }

    if (segment) {
      matchStage["Identification Segment"] = { $regex: segment, $options: "i" };
    }

    // Price filtering will be applied after grouping

    // Aggregation pipeline to group by brand + model
    const pipeline = [
      // Stage 1: Match basic filters
      ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),

      // Stage 2: Add computed price field (convert to lakhs)
      {
        $addFields: {
          priceInLakhs: {
            $cond: {
              if: { $gt: ["$Pricing Delhi Ex Showroom Price", 0] },
              then: { $divide: ["$Pricing Delhi Ex Showroom Price", 100000] },
              else: 0
            }
          }
        }
      },

      // Stage 3: Group by brand + model
      {
        $group: {
          _id: {
            brand: "$Identification Brand",
            model: "$Identification Model"
          },
          // Get the base variant (cheapest)
          baseVariant: { $first: "$$ROOT" },
          // Get all variants
          variants: { $push: "$$ROOT" },
          // Price range
          minPrice: { $min: "$priceInLakhs" },
          maxPrice: { $max: "$priceInLakhs" },
          // Count variants
          variantCount: { $sum: 1 },
          // Average mileage across variants
          avgMileage: { 
            $avg: {
              $cond: {
                if: { $gt: ["$Efficiency Mileage Arai", 0] },
                then: "$Efficiency Mileage Arai",
                else: null
              }
            }
          }
        }
      },

      // Stage 4: Apply price filtering on grouped data
      ...(priceMin > 0 || priceMax < 1000
        ? [{
            $match: {
              $or: [
                { minPrice: { $gte: priceMin, $lte: priceMax } },
                { maxPrice: { $gte: priceMin, $lte: priceMax } },
                { $and: [{ minPrice: { $lte: priceMin } }, { maxPrice: { $gte: priceMax } }] }
              ]
            }
          }]
        : []),

      // Stage 5: Sort by min price
      { $sort: { minPrice: 1 } },

      // Stage 6: Facet for pagination and total count
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [
            { $skip: (page - 1) * limit },
            { $limit: limit }
          ]
        }
      }
    ];

    const result = await db.collection(COLLECTIONS.CARS).aggregate(pipeline).toArray();

    const total = result[0]?.metadata[0]?.total || 0;
    const groupedCars = result[0]?.data || [];

    // Transform grouped data to Car format
    interface GroupedCarData {
      _id: { brand: string; model: string };
      baseVariant: Record<string, unknown>;
      variants: Array<Record<string, unknown>>;
      minPrice: number;
      maxPrice: number;
      variantCount: number;
      avgMileage: number | null;
    }
    
    const transformedCars = groupedCars.map((group: GroupedCarData) => {
      const baseVariant = group.baseVariant;
      const brand = group._id.brand || "Unknown";
      const model = group._id.model || "Unknown";

      // Transform the base variant to Car format
      return {
        _id: baseVariant._id.toString(),
        
        // Identification
        brand,
        model,
        variant: baseVariant["Identification Variant"] || "Base",
        year: baseVariant["Identification Year"] || 2024,
        bodyType: baseVariant["Identification Body Type"] || "Unknown",
        segment: baseVariant["Identification Segment"] || "Unknown",

        // Pricing - show range if multiple variants
        priceInLakhs: group.minPrice,
        priceRange: group.variantCount > 1 
          ? { min: group.minPrice, max: group.maxPrice }
          : undefined,

        // Metadata about variants
        variantCount: group.variantCount,
        variants: group.variants.map((v: Record<string, unknown>) => ({
          _id: v._id.toString(),
          name: v["Identification Variant"] || "Unknown",
          price: v.priceInLakhs || 0,
          transmission: v["Engine Transmission"] || "Manual",
          fuelType: determineFuelType(v["Engine Type"])
        })),

        // Dimensions (from base variant)
        length: baseVariant["Dimensions Length"] || 4000,
        width: baseVariant["Dimensions Width"] || 1700,
        height: baseVariant["Dimensions Height"] || 1500,
        wheelbase: baseVariant["Dimensions Wheelbase"] || 2500,
        groundClearance: baseVariant["Dimensions Ground Clearance"] || 165,
        weight: baseVariant["Dimensions Weight Kg"] || 1200,
        turningRadius: baseVariant["Dimensions Turning Radius"] || 5,
        fuelTank: baseVariant["Efficiency Tank Capacity"] || 45,

        // Engine
        displacement: baseVariant["Engine Cc"] || 1000,
        cylinders: baseVariant["Engine Cylinders"] || 3,
        turboNA: (baseVariant["Engine Turbo"] === true ? "Turbo" : "NA") as "Turbo" | "NA",
        powerBhp: baseVariant["Engine Bhp"] || 60,
        torqueNm: baseVariant["Engine Torque"] || 90,

        // Transmission
        transmissionType: baseVariant["Engine Transmission"] || "Manual",
        gearCount: parseInt(
          (baseVariant["Engine Gears"])?.toString().replace(/[^0-9]/g, "") || "5"
        ),
        driveType: baseVariant["Engine Drive"] || "FWD",

        // Performance
        acceleration0to100: baseVariant["Engine 0 100 Sec"] || 12,
        topSpeed: baseVariant["Engine Top Speed"] || 160,

        // Fuel & Emissions
        mileageARAI: group.avgMileage || baseVariant["Efficiency Mileage Arai"] || 20,
        emissionStandard: baseVariant["Efficiency Emission Standard"] || "BS6",
        adBlueSystem: baseVariant["Efficiency AdBlue System"] === true || false,

        // Safety
        airbags: baseVariant["Safety Airbags"] || 2,
        abs: baseVariant["Safety Abs"] === true || true,
        esc: baseVariant["Safety Esp"] === true || false,
        crashTestRating: baseVariant["Safety Ncap Stars"] || 0,
        parkingSensors: baseVariant["Safety Parking Sensors"] === true || false,
        parkingCamera: baseVariant["Features 360 Camera"] === true || false,
        isofix: baseVariant["Safety Isofix"] === true || false,
        hillHoldControl: baseVariant["Safety Hill Hold"] === true || false,
        tractionControl: baseVariant["Safety Traction Control"] === true || false,
        electronicBrakeDistribution: baseVariant["Safety Abs"] === true || true,

        // Comfort
        airConditioning: true,
        ventilatedSeats: baseVariant["Features Ventilated Seats"] === true || false,
        keylessEntry: baseVariant["Features Keyless Entry"] === true || false,
        cruiseControl: baseVariant["Features Cruise Control"] === true || false,
        sunroof: baseVariant["Features Sunroof"] === true || false,
        heatedSeats: baseVariant["Features Heated Seats"] === true || false,
        lumbarSupport: false,
        adjustableHeadrest: true,
        rearArmrest: false,
        cupHolders: 4,
        powerWindows: true,
        centralLocking: true,

        // Infotainment
        touchscreenSize: baseVariant["Features Touchscreen Inch"] || 7,
        carPlayAndroidAuto: baseVariant["Features Apple Carplay"] === true || false,
        speakers: 4,
        digitalCluster: baseVariant["Features Digital Cluster"] === true || false,
        connectedTech: baseVariant["Features Connected Tech"] === true || false,
        wirelessCharging: baseVariant["Features Wireless Charging"] === true || false,
        usbPorts: 2,
        bluetoothConnectivity: true,

        // Practicality
        bootSpace: baseVariant["Dimensions Boot Liters"] || 300,
        foldableSeats: true,
        roofRails: false,
        spareWheel: "Full" as const,

        // Exterior
        wheelSize: 15,
        ledHeadlights: baseVariant["Features Led Lights"] === true || false,
        drl: baseVariant["Features Drl"] === true || false,
        fogLamps: true,
        autoFoldingMirrors: false,
        alloyWheels: baseVariant["Features Alloy Wheels"] === true || false,

        // ADAS
        adaptiveCruise: baseVariant["Safety Adas Level 2"] === true || false,
        laneKeepAssist: baseVariant["Safety Lane Keep Assist"] === true || false,
        collisionWarning: baseVariant["Safety Collision Warning"] === true || false,
        automaticEmergencyBraking: false,
        blindSpotMonitor: baseVariant["Safety Blind Spot"] === true || false,
        rearCrossTrafficAlert: false,
        driverAttentionAlert: false,

        // Ownership
        warranty: baseVariant["Warranty Years"] && baseVariant["Warranty Km"]
          ? `${baseVariant["Warranty Years"]} Years/${baseVariant["Warranty Km"]?.toLocaleString('en-IN')} km`
          : "3 Years/1,00,000 km",
        serviceInterval: parseInt(
          (baseVariant["Warranty Service Km"])?.toString().replace(/[^0-9]/g, "") || "10000"
        ),
        roadsideAssistance: true,

        // UI state
        isFavorite: false,
        isInWishlist: false,
        rating: 4.0,
        reviewCount: Math.floor(Math.random() * 5000),
        images: generateCarImageUrls()
      };
    });

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
      grouped: true, // Indicate that results are grouped
    });
  } catch (error) {
    console.error("Error fetching grouped cars:", error);
    return NextResponse.json(
      { error: "Failed to fetch grouped cars", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * Helper function to determine fuel type from engine type string
 */
function determineFuelType(engineType: string): string {
  if (!engineType) return "Petrol";
  
  const type = engineType.toLowerCase();
  if (type.includes("electric")) return "Electric";
  if (type.includes("diesel")) return "Diesel";
  if (type.includes("hybrid")) return "Hybrid";
  if (type.includes("cng")) return "CNG";
  return "Petrol";
}

