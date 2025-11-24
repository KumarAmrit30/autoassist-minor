import { Car } from "@/types/car";
import { CarFilters } from "../ai/types";

export class CarFilterService {
  /**
   * Filter cars based on provided filters
   */
  filterCars(cars: Car[], filters: CarFilters): Car[] {
    let filtered = [...cars];

    // Price filters
    if (filters.minPrice !== undefined) {
      filtered = filtered.filter(
        (car) => car.priceInLakhs >= filters.minPrice!
      );
    }
    if (filters.maxPrice !== undefined) {
      filtered = filtered.filter(
        (car) => car.priceInLakhs <= filters.maxPrice!
      );
    }

    // Brand filter
    if (filters.brands && filters.brands.length > 0) {
      filtered = filtered.filter((car) =>
        filters.brands!.some(
          (brand) =>
            car.brand.toLowerCase().includes(brand.toLowerCase()) ||
            brand.toLowerCase().includes(car.brand.toLowerCase())
        )
      );
    }

    // Body type filter
    if (filters.bodyTypes && filters.bodyTypes.length > 0) {
      filtered = filtered.filter((car) =>
        filters.bodyTypes!.some(
          (type) => car.bodyType.toLowerCase() === type.toLowerCase()
        )
      );
    }

    // Seating capacity filters
    if (filters.minSeats !== undefined) {
      filtered = filtered.filter((car) => {
        // Estimate seating from body type if not explicitly available
        const estimatedSeats = this.estimateSeats(car);
        return estimatedSeats >= filters.minSeats!;
      });
    }
    if (filters.maxSeats !== undefined) {
      filtered = filtered.filter((car) => {
        const estimatedSeats = this.estimateSeats(car);
        return estimatedSeats <= filters.maxSeats!;
      });
    }

    // Mileage filter
    if (filters.minMileage !== undefined) {
      filtered = filtered.filter(
        (car) => car.mileageARAI >= filters.minMileage!
      );
    }

    // Transmission filter
    if (filters.transmission && filters.transmission.length > 0) {
      filtered = filtered.filter((car) =>
        filters.transmission!.includes(car.transmissionType)
      );
    }

    // Drive type filter
    if (filters.driveType && filters.driveType.length > 0) {
      filtered = filtered.filter((car) =>
        filters.driveType!.includes(car.driveType)
      );
    }

    // Safety filters
    if (filters.minAirbags !== undefined) {
      filtered = filtered.filter((car) => car.airbags >= filters.minAirbags!);
    }
    if (filters.minSafetyRating !== undefined) {
      filtered = filtered.filter(
        (car) => car.crashTestRating >= filters.minSafetyRating!
      );
    }

    // Segment filter
    if (filters.segment && filters.segment.length > 0) {
      filtered = filtered.filter((car) =>
        filters.segment!.some(
          (seg) => car.segment.toLowerCase() === seg.toLowerCase()
        )
      );
    }

    // Required features filter
    if (filters.requiredFeatures && filters.requiredFeatures.length > 0) {
      filtered = filtered.filter((car) =>
        this.hasRequiredFeatures(car, filters.requiredFeatures!)
      );
    }

    return filtered;
  }

  /**
   * Build MongoDB query from filters
   */
  buildMongoQuery(filters: CarFilters): any {
    const query: any = {};

    // Price filters (using database field name)
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      query.Price_Lakhs = {};
      if (filters.minPrice !== undefined) {
        query.Price_Lakhs.$gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        query.Price_Lakhs.$lte = filters.maxPrice;
      }
    }

    // Brand filter (using database field name)
    if (filters.brands && filters.brands.length > 0) {
      query.Identification_Brand = {
        $in: filters.brands.map((brand) => new RegExp(brand, "i")),
      };
    }

    // Body type filter (using database field name)
    if (filters.bodyTypes && filters.bodyTypes.length > 0) {
      query.Identification_Body_Type = {
        $in: filters.bodyTypes.map((type) => new RegExp(`^${type}$`, "i")),
      };
    }

    // Mileage filter (using database field name)
    if (filters.minMileage !== undefined) {
      query.Fuel_and_Emissions_Mileage_ARAI_kmpl = { $gte: filters.minMileage };
    }

    // Transmission filter (using database field name)
    if (filters.transmission && filters.transmission.length > 0) {
      query.Transmission_Transmission_Type = { $in: filters.transmission };
    }

    // Drive type filter (using database field name)
    if (filters.driveType && filters.driveType.length > 0) {
      query.Transmission_Drive_Type = { $in: filters.driveType };
    }

    // Safety filters (using database field names)
    if (filters.minAirbags !== undefined) {
      query.Safety_Airbags_Count = { $gte: filters.minAirbags };
    }
    if (filters.minSafetyRating !== undefined) {
      // Handle string ratings like "3-Star (GNCAP)"
      query.Safety_Crash_Test_Rating = { $exists: true };
    }

    // Segment filter (using database field name)
    if (filters.segment && filters.segment.length > 0) {
      query.Identification_Segment = {
        $in: filters.segment.map((seg) => new RegExp(`^${seg}$`, "i")),
      };
    }

    return query;
  }

  /**
   * Estimate seating capacity from body type
   * (since seating capacity might not be directly in the Car type)
   */
  private estimateSeats(car: Car): number {
    const bodyType = car.bodyType.toLowerCase();

    // Check if there's a variant hint
    const variant = car.variant?.toLowerCase() || "";
    if (variant.includes("7") || variant.includes("seven")) {
      return 7;
    }
    if (variant.includes("8") || variant.includes("eight")) {
      return 8;
    }

    // Estimate by body type
    switch (bodyType) {
      case "suv":
      case "muv":
      case "mpv":
        return 7; // Assume 7-seater for SUV/MUV/MPV
      case "sedan":
      case "hatchback":
        return 5;
      case "coupe":
      case "convertible":
        return 4;
      default:
        return 5; // Default assumption
    }
  }

  /**
   * Check if car has required features
   */
  private hasRequiredFeatures(car: Car, features: string[]): boolean {
    const lowerFeatures = features.map((f) => f.toLowerCase());

    for (const feature of lowerFeatures) {
      if (feature.includes("sunroof") && !car.sunroof) return false;
      if (feature.includes("cruise") && !car.cruiseControl) return false;
      if (feature.includes("keyless") && !car.keylessEntry) return false;
      if (feature.includes("parking camera") && !car.parkingCamera)
        return false;
      if (feature.includes("led") && !car.ledHeadlights) return false;
      if (feature.includes("wireless charging") && !car.wirelessCharging)
        return false;
      if (feature.includes("ventilated") && !car.ventilatedSeats) return false;
      if (feature.includes("carplay") && !car.carPlayAndroidAuto) return false;
      if (feature.includes("digital cluster") && !car.digitalCluster)
        return false;
      if (feature.includes("connected") && !car.connectedTech) return false;
      if (feature.includes("adaptive cruise") && !car.adaptiveCruise)
        return false;
      if (feature.includes("lane") && !car.laneKeepAssist) return false;
      if (feature.includes("collision") && !car.collisionWarning) return false;
      if (feature.includes("blind spot") && !car.blindSpotMonitor) return false;
    }

    return true;
  }

  /**
   * Get filter summary for display
   */
  getFilterSummary(filters: CarFilters): string[] {
    const summary: string[] = [];

    if (filters.minPrice && filters.maxPrice) {
      summary.push(`₹${filters.minPrice}L - ₹${filters.maxPrice}L`);
    } else if (filters.maxPrice) {
      summary.push(`Under ₹${filters.maxPrice}L`);
    } else if (filters.minPrice) {
      summary.push(`Above ₹${filters.minPrice}L`);
    }

    if (filters.brands && filters.brands.length > 0) {
      summary.push(filters.brands.join(", "));
    }

    if (filters.bodyTypes && filters.bodyTypes.length > 0) {
      summary.push(filters.bodyTypes.join(", "));
    }

    if (filters.minSeats) {
      summary.push(`${filters.minSeats}+ seater`);
    }

    if (filters.minMileage) {
      summary.push(`${filters.minMileage}+ kmpl`);
    }

    if (filters.transmission && filters.transmission.length > 0) {
      summary.push(filters.transmission.join(", "));
    }

    if (filters.minAirbags) {
      summary.push(`${filters.minAirbags}+ airbags`);
    }

    return summary;
  }
}

// Export singleton instance
export const carFilterService = new CarFilterService();
