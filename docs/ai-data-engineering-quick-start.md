# 🚀 Quick Start Guide: AI & Data Engineering Features

This guide provides practical implementation steps for the most impactful AI/Data Engineering features.

---

## 🎯 Quick Wins (Implement First)

### 1. **Analytics Event Tracking** (30 minutes)

**Step 1: Add Prisma Schema**
```prisma
// Add to packages/database/schema.prisma

model AnalyticsEvent {
  id        String   @id @default(cuid())
  eventType String   // 'booking_created', 'driveway_viewed', 'search_performed', etc.
  userId    String?
  sessionId String
  properties Json    // Flexible event properties
  timestamp DateTime @default(now())
  
  @@index([eventType])
  @@index([userId])
  @@index([timestamp])
  @@map("analytics_events")
}
```

**Step 2: Create Migration**
```bash
cd packages/database
npx prisma migrate dev --name add_analytics_events
```

**Step 3: Create Analytics Service**
```typescript
// apps/web/src/lib/analytics.ts
import { prisma } from '@parkway/database';

export type AnalyticsEventType = 
  | 'booking_created'
  | 'driveway_viewed'
  | 'search_performed'
  | 'payment_completed'
  | 'review_submitted'
  | 'user_registered'
  | 'driveway_created';

interface TrackEventParams {
  eventType: AnalyticsEventType;
  userId?: string;
  sessionId: string;
  properties?: Record<string, any>;
}

export async function trackEvent({
  eventType,
  userId,
  sessionId,
  properties = {}
}: TrackEventParams) {
  try {
    await prisma.analyticsEvent.create({
      data: {
        eventType,
        userId,
        sessionId,
        properties,
        timestamp: new Date()
      }
    });
  } catch (error) {
    // Don't break user flow if analytics fails
    console.error('Analytics tracking error:', error);
  }
}

// Helper to generate session ID
export function getSessionId(): string {
  if (typeof window !== 'undefined') {
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  }
  return `server_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
```

**Step 4: Use in API Routes**
```typescript
// Example: apps/web/src/app/api/bookings/route.ts
import { trackEvent } from '@/lib/analytics';

export async function POST(request: NextRequest) {
  // ... existing booking creation code ...
  
  // Track event
  await trackEvent({
    eventType: 'booking_created',
    userId: userId,
    sessionId: request.headers.get('x-session-id') || 'unknown',
    properties: {
      drivewayId,
      totalPrice,
      duration: hours,
      startTime: startTime.toISOString()
    }
  });
  
  // ... rest of code ...
}
```

---

### 2. **Enhanced Analytics API** (1 hour)

**Create Analytics Endpoint**
```typescript
// apps/web/src/app/api/analytics/overview/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@parkway/database';
import { requireAuth } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return authResult.error!;
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = searchParams.get('endDate') || new Date().toISOString();

    // Get comprehensive analytics
    const [
      totalEvents,
      bookingsCreated,
      searchesPerformed,
      revenue,
      topDriveways,
      userGrowth,
      popularTimes
    ] = await Promise.all([
      // Total events
      prisma.analyticsEvent.count({
        where: {
          timestamp: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        }
      }),

      // Bookings created
      prisma.analyticsEvent.count({
        where: {
          eventType: 'booking_created',
          timestamp: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        }
      }),

      // Searches performed
      prisma.analyticsEvent.count({
        where: {
          eventType: 'search_performed',
          timestamp: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        }
      }),

      // Revenue (from bookings)
      prisma.booking.aggregate({
        where: {
          paymentStatus: 'COMPLETED',
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        },
        _sum: { totalPrice: true }
      }).then(r => r._sum.totalPrice || 0),

      // Top driveways by views
      prisma.analyticsEvent.groupBy({
        by: ['properties'],
        where: {
          eventType: 'driveway_viewed',
          timestamp: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        },
        _count: true,
        orderBy: {
          _count: {
            properties: 'desc'
          }
        },
        take: 10
      }),

      // User growth
      prisma.user.groupBy({
        by: ['createdAt'],
        where: {
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        },
        _count: true
      }),

      // Popular booking times
      prisma.booking.groupBy({
        by: ['startTime'],
        where: {
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        },
        _count: true,
        orderBy: {
          _count: {
            startTime: 'desc'
          }
        },
        take: 10
      })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        period: { startDate, endDate },
        metrics: {
          totalEvents,
          bookingsCreated,
          searchesPerformed,
          revenue,
          conversionRate: searchesPerformed > 0 
            ? (bookingsCreated / searchesPerformed) * 100 
            : 0
        },
        insights: {
          topDriveways,
          userGrowth,
          popularTimes
        }
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
```

---

### 3. **Basic Price Recommendation (Simple ML)** (2 hours)

**Step 1: Create Price Recommendation Service**
```typescript
// apps/web/src/lib/ml/price-recommendation.ts

interface PriceRecommendationInput {
  drivewayId: string;
  currentPrice: number;
  historicalBookings: Array<{
    price: number;
    bookingsCount: number;
    timeOfDay: number;
    dayOfWeek: number;
  }>;
}

interface PriceRecommendation {
  recommendedPrice: number;
  confidence: number;
  factors: {
    demandLevel: 'low' | 'medium' | 'high';
    competitorPrice: number | null;
    historicalOptimal: number;
  };
}

export async function recommendPrice(
  input: PriceRecommendationInput
): Promise<PriceRecommendation> {
  const { currentPrice, historicalBookings } = input;

  // Simple rule-based approach (can be upgraded to ML model later)
  // Calculate optimal price based on:
  // 1. Historical booking success at different prices
  // 2. Time-based demand patterns
  // 3. Current market conditions

  // Find price that maximizes bookings * price
  const pricePoints = [currentPrice * 0.8, currentPrice * 0.9, currentPrice, currentPrice * 1.1, currentPrice * 1.2];
  
  let bestPrice = currentPrice;
  let bestScore = 0;

  for (const price of pricePoints) {
    // Estimate bookings at this price based on historical data
    const similarBookings = historicalBookings.filter(
      b => Math.abs(b.price - price) / price < 0.2 // Within 20%
    );

    if (similarBookings.length > 0) {
      const avgBookings = similarBookings.reduce((sum, b) => sum + b.bookingsCount, 0) / similarBookings.length;
      const estimatedRevenue = avgBookings * price;
      
      if (estimatedRevenue > bestScore) {
        bestScore = estimatedRevenue;
        bestPrice = price;
      }
    }
  }

  // Calculate confidence based on data availability
  const confidence = historicalBookings.length > 10 ? 0.8 : historicalBookings.length > 5 ? 0.6 : 0.4;

  return {
    recommendedPrice: Math.round(bestPrice * 100) / 100,
    confidence,
    factors: {
      demandLevel: bestPrice > currentPrice ? 'high' : bestPrice < currentPrice ? 'low' : 'medium',
      competitorPrice: null, // Can be added with competitor data
      historicalOptimal: bestPrice
    }
  };
}
```

**Step 2: Create API Endpoint**
```typescript
// apps/web/src/app/api/ai/pricing/recommendations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@parkway/database';
import { requireAuth } from '@/lib/auth-middleware';
import { recommendPrice } from '@/lib/ml/price-recommendation';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return authResult.error!;
    }

    const { searchParams } = new URL(request.url);
    const drivewayId = searchParams.get('drivewayId');

    if (!drivewayId) {
      return NextResponse.json(
        { success: false, error: 'drivewayId is required' },
        { status: 400 }
      );
    }

    // Get driveway
    const driveway = await prisma.driveway.findUnique({
      where: { id: drivewayId }
    });

    if (!driveway) {
      return NextResponse.json(
        { success: false, error: 'Driveway not found' },
        { status: 404 }
      );
    }

    // Get historical bookings
    const bookings = await prisma.booking.findMany({
      where: {
        drivewayId,
        status: { in: ['CONFIRMED', 'COMPLETED'] },
        paymentStatus: 'COMPLETED'
      },
      select: {
        totalPrice: true,
        startTime: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 100 // Last 100 bookings
    });

    // Transform to format needed for recommendation
    const historicalBookings = bookings.map(b => ({
      price: b.totalPrice / ((b.startTime.getTime() - new Date(b.startTime).setHours(0, 0, 0, 0)) / (1000 * 60 * 60)), // Price per hour
      bookingsCount: 1,
      timeOfDay: b.startTime.getHours(),
      dayOfWeek: b.startTime.getDay()
    }));

    // Get recommendation
    const recommendation = await recommendPrice({
      drivewayId,
      currentPrice: driveway.pricePerHour,
      historicalBookings
    });

    return NextResponse.json({
      success: true,
      data: {
        drivewayId,
        currentPrice: driveway.pricePerHour,
        recommendation
      }
    });
  } catch (error) {
    console.error('Price recommendation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate price recommendation' },
      { status: 500 }
    );
  }
}
```

---

### 4. **Time-Series Metrics Aggregation** (1 hour)

**Create Cron Job for Metrics**
```typescript
// apps/web/src/app/api/cron/aggregate-metrics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@parkway/database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  // Verify this is called by cron (add secret in production)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const now = new Date();
    const hourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0, 0);

    // Get all active driveways
    const driveways = await prisma.driveway.findMany({
      where: { isActive: true },
      select: { id: true, capacity: true }
    });

    // Aggregate metrics for each driveway
    for (const driveway of driveways) {
      const bookings = await prisma.booking.findMany({
        where: {
          drivewayId: driveway.id,
          startTime: {
            gte: hourStart,
            lt: new Date(hourStart.getTime() + 60 * 60 * 1000)
          },
          status: { in: ['CONFIRMED', 'COMPLETED'] }
        }
      });

      const bookingsCount = bookings.length;
      const revenue = bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
      const avgDuration = bookings.length > 0
        ? bookings.reduce((sum, b) => {
            const duration = (b.endTime.getTime() - b.startTime.getTime()) / (1000 * 60 * 60);
            return sum + duration;
          }, 0) / bookings.length
        : 0;
      const occupancyRate = bookingsCount / (driveway.capacity || 1);

      // Store in a metrics table (you'll need to create this)
      // For now, we'll log it - you can create a proper table later
      console.log(`Metrics for driveway ${driveway.id} at ${hourStart}:`, {
        bookingsCount,
        revenue,
        avgDuration,
        occupancyRate
      });

      // TODO: Create BookingMetricsHourly table and store here
      // await prisma.bookingMetricsHourly.upsert({...});
    }

    return NextResponse.json({ 
      success: true, 
      message: `Aggregated metrics for ${driveways.length} driveways`,
      timestamp: hourStart.toISOString()
    });
  } catch (error) {
    console.error('Metrics aggregation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to aggregate metrics' },
      { status: 500 }
    );
  }
}
```

**Set up Vercel Cron Job**
```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/aggregate-metrics",
      "schedule": "0 * * * *"
    }
  ]
}
```

---

## 📋 Implementation Checklist

### **Week 1: Foundation**
- [ ] Add AnalyticsEvent model to Prisma schema
- [ ] Create migration for analytics events
- [ ] Implement trackEvent service
- [ ] Add event tracking to key API routes
- [ ] Create analytics overview endpoint
- [ ] Test event tracking in production

### **Week 2: Metrics & Aggregation**
- [ ] Create BookingMetricsHourly model
- [ ] Implement metrics aggregation cron job
- [ ] Set up Vercel cron scheduling
- [ ] Create metrics dashboard endpoint
- [ ] Add metrics visualization (frontend)

### **Week 3: ML Basics**
- [ ] Implement price recommendation service
- [ ] Create pricing API endpoint
- [ ] Add recommendation UI component
- [ ] Test and refine recommendations
- [ ] Document ML decision logic

### **Week 4: Enhancement**
- [ ] Add more event types
- [ ] Implement demand forecasting basics
- [ ] Create recommendation system foundation
- [ ] Add data export functionality
- [ ] Set up monitoring and alerts

---

## 🔧 Environment Variables Needed

Add to your `.env`:
```env
# Analytics
ANALYTICS_ENABLED=true

# Cron Jobs
CRON_SECRET=your-secret-here

# ML Features (future)
OPENAI_API_KEY=your-key-here  # For NLP features
ML_SERVICE_URL=https://your-ml-service.com  # If using separate ML service
```

---

## 📚 Next Steps

1. **Review the main document** (`ai-data-engineering-improvements.md`)
2. **Start with Quick Wins** - Implement analytics tracking first
3. **Build incrementally** - Add features one at a time
4. **Measure impact** - Track improvements with metrics
5. **Iterate** - Refine based on data and feedback

---

## 🆘 Troubleshooting

### **Analytics events not tracking?**
- Check database connection
- Verify Prisma client is generated
- Check error logs in console

### **Cron job not running?**
- Verify CRON_SECRET is set
- Check Vercel cron configuration
- Review Vercel function logs

### **Price recommendations seem off?**
- Ensure sufficient historical data
- Check data quality
- Adjust recommendation algorithm parameters

---

**Good luck with your implementation!** 🚀







