/**
 * Pricing Service - Handles dynamic pricing calculations
 * 
 * Features:
 * - Base pricing from driveway owner
 * - Surge pricing based on demand
 * - Time-based pricing (peak hours, weekends)
 * - Minimum price enforcement ($0.50)
 * - Minimum duration enforcement (10 minutes)
 */

export interface PricingFactors {
  basePricePerHour: number;
  startTime: Date;
  endTime: Date;
  demandMultiplier?: number; // 1.0 = no surge, 1.5 = 50% surge, etc.
  timeOfDayMultiplier?: number; // Peak hours multiplier
  dayOfWeekMultiplier?: number; // Weekend multiplier
}

export interface PricingBreakdown {
  basePrice: number;
  hours: number;
  baseTotal: number;
  surgeMultiplier: number;
  timeMultiplier: number;
  dayMultiplier: number;
  subtotal: number;
  finalPrice: number;
  minimumPrice: number;
  meetsMinimum: boolean;
}

export class PricingService {
  // Minimum booking duration: 10 minutes
  static readonly MIN_DURATION_MINUTES = 10;
  static readonly MIN_DURATION_MS = PricingService.MIN_DURATION_MINUTES * 60 * 1000;
  
  // Minimum payment amount: $0.50 (50 cents)
  static readonly MIN_PRICE_CENTS = 50;
  static readonly MIN_PRICE_DOLLARS = PricingService.MIN_PRICE_CENTS / 100;
  
  // Maximum booking duration: 7 days
  static readonly MAX_DURATION_DAYS = 7;
  static readonly MAX_DURATION_MS = PricingService.MAX_DURATION_DAYS * 24 * 60 * 60 * 1000;

  /**
   * Calculate dynamic pricing for a booking
   */
  static calculatePrice(factors: PricingFactors): PricingBreakdown {
    const { basePricePerHour, startTime, endTime } = factors;
    
    // Calculate duration
    const durationMs = endTime.getTime() - startTime.getTime();
    const hours = durationMs / (1000 * 60 * 60);
    const minutes = (durationMs / (1000 * 60)) % 60;
    
    // Base calculation
    const baseTotal = hours * basePricePerHour;
    
    // Apply multipliers
    const demandMultiplier = factors.demandMultiplier ?? 1.0;
    const timeMultiplier = factors.timeOfDayMultiplier ?? this.getTimeOfDayMultiplier(startTime);
    const dayMultiplier = factors.dayOfWeekMultiplier ?? this.getDayOfWeekMultiplier(startTime);
    
    // Calculate subtotal with all multipliers
    const subtotal = baseTotal * demandMultiplier * timeMultiplier * dayMultiplier;
    
    // Round to 2 decimal places
    const finalPrice = Math.round(subtotal * 100) / 100;
    
    // Ensure minimum price
    const meetsMinimum = finalPrice >= this.MIN_PRICE_DOLLARS;
    const adjustedPrice = meetsMinimum ? finalPrice : this.MIN_PRICE_DOLLARS;
    
    return {
      basePrice: basePricePerHour,
      hours,
      baseTotal: Math.round(baseTotal * 100) / 100,
      surgeMultiplier: demandMultiplier,
      timeMultiplier,
      dayMultiplier,
      subtotal: Math.round(subtotal * 100) / 100,
      finalPrice: adjustedPrice,
      minimumPrice: this.MIN_PRICE_DOLLARS,
      meetsMinimum,
    };
  }

  /**
   * Get time-of-day multiplier (peak hours pricing)
   * Peak hours: 7-9 AM, 5-7 PM (rush hours)
   */
  static getTimeOfDayMultiplier(date: Date): number {
    const hour = date.getHours();
    
    // Morning rush: 7-9 AM
    if (hour >= 7 && hour < 9) {
      return 1.2; // 20% premium
    }
    
    // Evening rush: 5-7 PM
    if (hour >= 17 && hour < 19) {
      return 1.2; // 20% premium
    }
    
    // Late night: 10 PM - 6 AM
    if (hour >= 22 || hour < 6) {
      return 0.9; // 10% discount
    }
    
    return 1.0; // Standard pricing
  }

  /**
   * Get day-of-week multiplier (weekend pricing)
   */
  static getDayOfWeekMultiplier(date: Date): number {
    const dayOfWeek = date.getDay();
    
    // Weekend (Saturday = 6, Sunday = 0)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return 1.15; // 15% premium on weekends
    }
    
    return 1.0; // Standard pricing on weekdays
  }

  /**
   * Calculate demand multiplier based on nearby bookings
   * This simulates surge pricing - higher demand = higher price
   */
  static calculateDemandMultiplier(
    nearbyBookingsCount: number,
    totalCapacity: number
  ): number {
    if (totalCapacity === 0) return 1.0;
    
    const utilizationRate = nearbyBookingsCount / totalCapacity;
    
    // Surge pricing tiers:
    // 0-50% utilization: No surge (1.0x)
    // 50-75% utilization: 1.2x (20% surge)
    // 75-90% utilization: 1.5x (50% surge)
    // 90-100% utilization: 2.0x (100% surge)
    
    if (utilizationRate >= 0.9) {
      return 2.0;
    } else if (utilizationRate >= 0.75) {
      return 1.5;
    } else if (utilizationRate >= 0.5) {
      return 1.2;
    }
    
    return 1.0;
  }

  /**
   * Validate booking duration
   */
  static validateDuration(startTime: Date, endTime: Date): {
    valid: boolean;
    error?: string;
    durationMinutes?: number;
  } {
    const durationMs = endTime.getTime() - startTime.getTime();
    const durationMinutes = durationMs / (1000 * 60);
    
    // Check minimum duration
    if (durationMinutes < this.MIN_DURATION_MINUTES) {
      return {
        valid: false,
        error: `Minimum booking duration is ${this.MIN_DURATION_MINUTES} minutes. Please select a longer time period.`,
        durationMinutes,
      };
    }
    
    // Check maximum duration
    if (durationMs > this.MAX_DURATION_MS) {
      return {
        valid: false,
        error: `Maximum booking duration is ${this.MAX_DURATION_DAYS} days. Please select a shorter time period.`,
        durationMinutes,
      };
    }
    
    return {
      valid: true,
      durationMinutes,
    };
  }

  /**
   * Calculate minimum price per hour to ensure $0.50 minimum for 10 minutes
   * Formula: minPricePerHour = (MIN_PRICE_DOLLARS / MIN_DURATION_HOURS)
   */
  static calculateMinimumPricePerHour(): number {
    const minDurationHours = this.MIN_DURATION_MINUTES / 60; // 10 minutes = 0.167 hours
    return this.MIN_PRICE_DOLLARS / minDurationHours; // ~$3.00/hour minimum
  }

  /**
   * Validate that price meets minimum requirement
   */
  static validatePrice(price: number): {
    valid: boolean;
    error?: string;
    adjustedPrice?: number;
  } {
    if (price < this.MIN_PRICE_DOLLARS) {
      return {
        valid: false,
        error: `Minimum payment amount is $${this.MIN_PRICE_DOLLARS.toFixed(2)}. The calculated price is too low.`,
        adjustedPrice: this.MIN_PRICE_DOLLARS,
      };
    }
    
    return {
      valid: true,
    };
  }

  /**
   * Format pricing breakdown for display
   */
  static formatPricingBreakdown(breakdown: PricingBreakdown): {
    basePrice: string;
    duration: string;
    baseTotal: string;
    multipliers: string[];
    subtotal: string;
    finalPrice: string;
    savings?: string;
  } {
    const multipliers: string[] = [];
    
    if (breakdown.surgeMultiplier > 1.0) {
      multipliers.push(`Demand: ${(breakdown.surgeMultiplier * 100 - 100).toFixed(0)}% surge`);
    }
    
    if (breakdown.timeMultiplier > 1.0) {
      multipliers.push(`Peak hours: +${((breakdown.timeMultiplier - 1) * 100).toFixed(0)}%`);
    } else if (breakdown.timeMultiplier < 1.0) {
      multipliers.push(`Off-peak: ${((1 - breakdown.timeMultiplier) * 100).toFixed(0)}% discount`);
    }
    
    if (breakdown.dayMultiplier > 1.0) {
      multipliers.push(`Weekend: +${((breakdown.dayMultiplier - 1) * 100).toFixed(0)}%`);
    }
    
    const savings = breakdown.baseTotal > breakdown.finalPrice 
      ? `$${(breakdown.baseTotal - breakdown.finalPrice).toFixed(2)}`
      : undefined;
    
    return {
      basePrice: `$${breakdown.basePrice.toFixed(2)}/hr`,
      duration: `${breakdown.hours.toFixed(2)} hours`,
      baseTotal: `$${breakdown.baseTotal.toFixed(2)}`,
      multipliers,
      subtotal: `$${breakdown.subtotal.toFixed(2)}`,
      finalPrice: `$${breakdown.finalPrice.toFixed(2)}`,
      savings,
    };
  }
}
