import { Car } from "@/types/car";
import {
  CarFilters,
  ChatContext,
  CarRecommendation,
  ScoringWeights,
} from "../ai/types";
import { DEFAULT_SCORING_WEIGHTS, USE_CASE_CONFIGS } from "../ai/config";

export class CarScoringService {
  /**
   * Score and rank cars based on filters and context
   */
  scoreCars(
    cars: Car[],
    filters: CarFilters,
    context: ChatContext
  ): CarRecommendation[] {
    // Filter out cars with missing critical data
    const validCars = cars.filter((car) => {
      return (
        car &&
        car.brand &&
        car.model &&
        car.priceInLakhs !== undefined &&
        car.priceInLakhs !== null &&
        car.mileageARAI !== undefined &&
        car.mileageARAI !== null
      );
    });

    const scored = validCars.map((car) => {
      const score = this.calculateScore(car, filters, context);
      const highlights = this.generateHighlights(car, filters, context);

      return {
        id: car._id || `${car.brand}_${car.model}`,
        name: `${car.brand} ${car.model} ${car.variant || ""}`.trim(),
        price: car.priceInLakhs,
        brand: car.brand,
        bodyType: car.bodyType || "Unknown",
        mileage: car.mileageARAI,
        score,
        highlights,
        car,
      };
    });

    // Sort by score descending
    return scored.sort((a, b) => b.score - a.score);
  }

  /**
   * Calculate score for a single car (0-100)
   */
  calculateScore(car: Car, filters: CarFilters, context: ChatContext): number {
    let score = 0;
    const weights = this.getWeights(context);

    // Price score (0-25 points)
    score += this.calculatePriceScore(car, filters) * weights.price;

    // Mileage score (0-20 points)
    score += this.calculateMileageScore(car, filters) * weights.mileage;

    // Safety score (0-20 points)
    score += this.calculateSafetyScore(car, filters) * weights.safety;

    // Features score (0-15 points)
    score += this.calculateFeaturesScore(car) * weights.features;

    // Performance score (0-10 points)
    score += this.calculatePerformanceScore(car) * weights.performance;

    // Comfort score (0-10 points)
    score += this.calculateComfortScore(car) * weights.comfort;

    // Context bonus (0-20 points)
    score += this.calculateContextBonus(car, context);

    // Priority multiplier
    score = this.applyPriorityMultiplier(score, car, filters, context);

    return Math.min(Math.round(score), 100);
  }

  /**
   * Get scoring weights based on context
   */
  private getWeights(context: ChatContext): ScoringWeights {
    if (context.useCase && context.useCase !== "general") {
      const useCaseConfig = USE_CASE_CONFIGS[context.useCase];
      if (useCaseConfig?.scoringWeights) {
        return {
          ...DEFAULT_SCORING_WEIGHTS,
          ...useCaseConfig.scoringWeights,
        } as ScoringWeights;
      }
    }
    return DEFAULT_SCORING_WEIGHTS;
  }

  /**
   * Calculate price score (closer to sweet spot = higher score)
   */
  private calculatePriceScore(car: Car, filters: CarFilters): number {
    const price = car.priceInLakhs || 0;
    if (!price) return 0;

    let score = 50; // Base score

    // If max price is specified, score based on how well it fits budget
    if (filters.maxPrice) {
      const budgetUsage = price / filters.maxPrice;

      if (budgetUsage <= 0.7) {
        // Great value - well under budget
        score = 90;
      } else if (budgetUsage <= 0.85) {
        // Good value - reasonably under budget
        score = 80;
      } else if (budgetUsage <= 0.95) {
        // Within budget sweet spot
        score = 100;
      } else if (budgetUsage <= 1.0) {
        // At budget limit
        score = 70;
      } else {
        // Over budget (shouldn't happen if filtered correctly)
        score = 30;
      }
    }

    // Adjust if min price is specified (looking for premium)
    if (filters.minPrice && price >= filters.minPrice) {
      score = Math.max(score, 80); // Boost premium cars
    }

    return score;
  }

  /**
   * Calculate mileage score
   */
  private calculateMileageScore(car: Car, filters: CarFilters): number {
    const mileage = car.mileageARAI || 0;
    if (!mileage) return 0;

    let score = 0;

    if (mileage >= 25) {
      score = 100; // Excellent
    } else if (mileage >= 20) {
      score = 85; // Very good
    } else if (mileage >= 18) {
      score = 70; // Good
    } else if (mileage >= 15) {
      score = 55; // Average
    } else if (mileage >= 12) {
      score = 40; // Below average
    } else {
      score = 25; // Poor
    }

    // Bonus if exceeds minimum requirement
    if (filters.minMileage && mileage > filters.minMileage + 5) {
      score = Math.min(score + 15, 100);
    }

    return score;
  }

  /**
   * Calculate safety score
   */
  private calculateSafetyScore(car: Car, filters: CarFilters): number {
    let score = 0;

    // Airbags (0-40 points)
    const airbags = car.airbags || 0;
    if (airbags >= 6) {
      score += 40;
    } else if (airbags >= 4) {
      score += 30;
    } else if (airbags >= 2) {
      score += 20;
    } else if (airbags >= 1) {
      score += 10;
    }

    // Safety features (0-40 points)
    let featureCount = 0;
    if (car.abs) featureCount++;
    if (car.esc) featureCount++;
    if (car.tractionControl) featureCount++;
    if (car.hillHoldControl) featureCount++;
    if (car.electronicBrakeDistribution) featureCount++;
    if (car.isofix) featureCount++;

    score += (featureCount / 6) * 40;

    // Crash test rating (0-20 points)
    const rating = car.crashTestRating || 0;
    if (rating >= 5) {
      score += 20;
    } else if (rating >= 4) {
      score += 15;
    } else if (rating >= 3) {
      score += 10;
    } else if (rating > 0) {
      score += 5;
    }

    return score;
  }

  /**
   * Calculate features score
   */
  private calculateFeaturesScore(car: Car): number {
    let score = 0;

    // Infotainment (0-30 points)
    const touchscreenSize = car.touchscreenSize || 0;
    if (touchscreenSize >= 10) score += 15;
    else if (touchscreenSize >= 7) score += 10;
    else if (touchscreenSize > 0) score += 5;

    if (car.carPlayAndroidAuto) score += 8;
    if (car.digitalCluster) score += 7;

    // Comfort features (0-30 points)
    if (car.sunroof) score += 10;
    if (car.keylessEntry) score += 5;
    if (car.cruiseControl) score += 5;
    if (car.ventilatedSeats) score += 5;
    if (car.wirelessCharging) score += 5;

    // ADAS features (0-40 points)
    let adasCount = 0;
    if (car.adaptiveCruise) adasCount++;
    if (car.laneKeepAssist) adasCount++;
    if (car.collisionWarning) adasCount++;
    if (car.automaticEmergencyBraking) adasCount++;
    if (car.blindSpotMonitor) adasCount++;

    score += (adasCount / 5) * 40;

    return score;
  }

  /**
   * Calculate performance score
   */
  private calculatePerformanceScore(car: Car): number {
    let score = 0;

    // Power (0-40 points)
    const powerBhp = car.powerBhp || 0;
    if (powerBhp >= 200) {
      score += 40;
    } else if (powerBhp >= 150) {
      score += 30;
    } else if (powerBhp >= 100) {
      score += 20;
    } else if (powerBhp > 0) {
      score += 10;
    }

    // Torque (0-30 points)
    const torqueNm = car.torqueNm || 0;
    if (torqueNm >= 350) {
      score += 30;
    } else if (torqueNm >= 250) {
      score += 20;
    } else if (torqueNm >= 150) {
      score += 10;
    } else if (torqueNm > 0) {
      score += 5;
    }

    // Turbo (0-15 points)
    if (car.turboNA === "Turbo") {
      score += 15;
    }

    // Acceleration (0-15 points)
    const acceleration = car.acceleration0to100 || 0;
    if (acceleration > 0) {
      if (acceleration <= 8) {
        score += 15;
      } else if (acceleration <= 10) {
        score += 10;
      } else if (acceleration <= 12) {
        score += 5;
      }
    }

    return score;
  }

  /**
   * Calculate comfort score
   */
  private calculateComfortScore(car: Car): number {
    let score = 0;

    // Seating comfort (0-40 points)
    if (car.ventilatedSeats) score += 15;
    if (car.heatedSeats) score += 10;
    if (car.lumbarSupport) score += 8;
    if (car.adjustableHeadrest) score += 7;

    // Space (0-30 points)
    const bootSpace = car.bootSpace || 0;
    if (bootSpace >= 500) score += 15;
    else if (bootSpace >= 350) score += 10;
    else if (bootSpace >= 200) score += 5;

    if (car.foldableSeats) score += 10;
    if (car.rearArmrest) score += 5;

    // Climate (0-30 points)
    if (car.airConditioning) score += 15;
    if (car.sunroof) score += 10;
    if (car.powerWindows) score += 5;

    return score;
  }

  /**
   * Calculate context bonus (use case specific bonuses)
   */
  private calculateContextBonus(car: Car, context: ChatContext): number {
    let bonus = 0;

    if (!context.useCase || context.useCase === "general") {
      return 0;
    }

    switch (context.useCase) {
      case "family":
        // Bonus for 7-seater capability
        if (car.bodyType && ["SUV", "MUV", "MPV"].includes(car.bodyType))
          bonus += 10;
        if ((car.airbags || 0) >= 6) bonus += 5;
        if (car.isofix) bonus += 3;
        if ((car.bootSpace || 0) >= 400) bonus += 2;
        break;

      case "daily_commute":
        // Bonus for excellent mileage
        if ((car.mileageARAI || 0) >= 20) bonus += 10;
        if ((car.mileageARAI || 0) >= 25) bonus += 5;
        if (car.bodyType && ["Hatchback", "Sedan"].includes(car.bodyType))
          bonus += 3;
        break;

      case "highway":
        // Bonus for highway capability
        if (car.cruiseControl) bonus += 8;
        if ((car.powerBhp || 0) >= 100) bonus += 5;
        if (car.ventilatedSeats) bonus += 4;
        if ((car.bootSpace || 0) >= 400) bonus += 3;
        break;

      case "first_car":
        // Bonus for beginner-friendly features
        if (car.parkingCamera) bonus += 8;
        if (car.parkingSensors) bonus += 5;
        if ((car.priceInLakhs || 0) <= 8) bonus += 7;
        break;

      case "luxury":
        // Bonus for premium features
        if (car.ventilatedSeats) bonus += 5;
        if (car.sunroof) bonus += 4;
        if (car.digitalCluster) bonus += 3;
        if (car.adaptiveCruise) bonus += 5;
        if (car.connectedTech) bonus += 3;
        break;

      case "off_road":
        // Bonus for off-road capability
        if (car.driveType === "4WD" || car.driveType === "AWD") bonus += 12;
        if ((car.groundClearance || 0) >= 200) bonus += 5;
        if (car.bodyType === "SUV") bonus += 3;
        break;
    }

    return bonus;
  }

  /**
   * Apply priority multiplier based on user's stated priority
   */
  private applyPriorityMultiplier(
    score: number,
    car: Car,
    filters: CarFilters,
    context: ChatContext
  ): number {
    if (!context.priority) return score;

    let multiplier = 1.0;

    switch (context.priority) {
      case "price":
        // Boost score for cars that offer good value
        const priceScore = this.calculatePriceScore(car, filters);
        if (priceScore >= 80) multiplier = 1.1;
        break;

      case "safety":
        // Boost score for safer cars
        if ((car.airbags || 0) >= 6 && (car.crashTestRating || 0) >= 4) {
          multiplier = 1.15;
        }
        break;

      case "efficiency":
        // Boost score for fuel-efficient cars
        if ((car.mileageARAI || 0) >= 20) {
          multiplier = 1.12;
        }
        break;

      case "features":
        // Boost score for feature-rich cars
        const featureScore = this.calculateFeaturesScore(car);
        if (featureScore >= 70) multiplier = 1.1;
        break;

      case "performance":
        // Boost score for high-performance cars
        if ((car.powerBhp || 0) >= 150 || car.turboNA === "Turbo") {
          multiplier = 1.1;
        }
        break;

      case "comfort":
        // Boost score for comfortable cars
        if (car.ventilatedSeats && car.sunroof) {
          multiplier = 1.1;
        }
        break;
    }

    return score * multiplier;
  }

  /**
   * Generate highlights for a car
   */
  private generateHighlights(
    car: Car,
    filters: CarFilters,
    context: ChatContext
  ): string[] {
    const highlights: string[] = [];

    // Price highlight
    if (car.priceInLakhs) {
      highlights.push(`₹${car.priceInLakhs.toFixed(2)} Lakhs`);
    }

    // Mileage highlight
    if (car.mileageARAI) {
      highlights.push(`${car.mileageARAI} kmpl`);
    }

    // Safety highlight
    const airbags = car.airbags || 0;
    if (airbags >= 6) {
      highlights.push(`${airbags} Airbags`);
    } else if (airbags >= 4) {
      highlights.push(`${airbags} Airbags`);
    }

    // Transmission
    if (car.transmissionType) {
      highlights.push(car.transmissionType);
    }

    // Body type
    if (car.bodyType) {
      highlights.push(car.bodyType);
    }

    // Context-specific highlights
    if (context.useCase === "family") {
      if (car.isofix) highlights.push("ISOFIX");
      if ((car.bootSpace || 0) >= 400)
        highlights.push(`${car.bootSpace}L Boot`);
    } else if (context.useCase === "daily_commute") {
      if (car.keylessEntry) highlights.push("Keyless Entry");
    } else if (context.useCase === "highway") {
      if (car.cruiseControl) highlights.push("Cruise Control");
    } else if (context.useCase === "luxury") {
      if (car.sunroof) highlights.push("Sunroof");
      if (car.ventilatedSeats) highlights.push("Ventilated Seats");
    }

    // Feature highlights
    if (car.carPlayAndroidAuto) highlights.push("Apple CarPlay/Android Auto");
    if (car.sunroof && !highlights.includes("Sunroof"))
      highlights.push("Sunroof");
    if (car.adaptiveCruise) highlights.push("Adaptive Cruise Control");

    // Power highlight if significant
    if ((car.powerBhp || 0) >= 150) {
      highlights.push(`${car.powerBhp} BHP`);
    }

    // Crash test rating
    if ((car.crashTestRating || 0) >= 4) {
      highlights.push(`${car.crashTestRating}★ Safety Rating`);
    }

    // Limit to top 7 highlights
    return highlights.slice(0, 7);
  }
}

// Export singleton instance
export const carScoringService = new CarScoringService();
