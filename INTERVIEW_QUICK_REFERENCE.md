# SDE 1 Interview Quick Reference - Parkway Project
## Key Talking Points & Technical Highlights

---

## PROJECT ELEVATOR PITCH (30 seconds)

"I built Parkway, a full-stack driveway rental marketplace platform using Next.js 14, TypeScript, and PostgreSQL. It's a monorepo architecture deployed on Vercel with 100% free hosting. The platform handles user authentication, real-time bookings, Stripe payments, and includes comprehensive testing with 90%+ coverage. I implemented JWT authentication, database transactions for booking concurrency, and integrated multiple third-party services like Cloudinary and Stripe."

---

## KEY TECHNICAL HIGHLIGHTS

### Architecture
- **Monorepo**: Turborepo for build optimization
- **Frontend**: Next.js 14 App Router, React 18, TypeScript
- **Backend**: Next.js API routes (serverless)
- **Database**: PostgreSQL with Prisma ORM on Supabase
- **Deployment**: Vercel (serverless functions)
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod validation

### Key Features Implemented
1. **Authentication**: JWT with refresh tokens, role-based access
2. **Bookings**: Transaction-based booking system with capacity management
3. **Payments**: Stripe integration with webhooks
4. **Search**: Location-based search with map integration (Leaflet)
5. **Real-time**: Socket.io for notifications
6. **Testing**: Jest, Playwright, 90%+ coverage
7. **Image Upload**: Cloudinary integration

### Database Schema
- **5 Models**: User, Driveway, Booking, Review, Notification
- **Relationships**: Proper foreign keys with cascade deletes
- **Indexes**: Optimized for common queries
- **Enums**: Status fields for type safety

### Security Measures
- Password hashing with bcrypt
- JWT tokens in HTTP-only cookies
- Input validation with Zod
- SQL injection prevention (Prisma)
- XSS protection (React)
- CORS configuration

---

## COMMON QUESTIONS & ANSWERS

### "Tell me about your project"
**Answer Structure:**
1. **What it is**: Driveway rental marketplace
2. **Tech stack**: Next.js, TypeScript, PostgreSQL, Prisma
3. **Architecture**: Monorepo, serverless deployment
4. **Key features**: Auth, bookings, payments, search
5. **Challenges solved**: Booking concurrency, payment integration
6. **Results**: 90%+ test coverage, production-ready

### "What was the hardest problem you solved?"
**Good Answers:**
- **Booking race conditions**: Used database transactions
- **Payment webhook handling**: Idempotent processing
- **Real-time updates**: WebSocket implementation
- **Database optimization**: Query optimization and indexing
- **Deployment issues**: Serverless function configuration

### "Why did you choose [technology]?"
**Template:**
- **Next.js**: Server-side rendering, API routes, great DX
- **Prisma**: Type safety, migrations, excellent TypeScript support
- **Vercel**: Serverless, automatic deployments, free tier
- **PostgreSQL**: Relational data, ACID compliance, scalability
- **TypeScript**: Type safety, better DX, fewer bugs

### "How would you scale this?"
**Key Points:**
1. **Database**: Read replicas, connection pooling, indexing
2. **Caching**: Redis for API responses
3. **CDN**: Static assets and images
4. **Load balancing**: Multiple serverless function instances
5. **Monitoring**: Performance tracking and alerting

---

## CODE EXAMPLES TO KNOW

### 1. Database Transaction (Booking Creation)
```typescript
const booking = await prisma.$transaction(async (tx) => {
  // Check capacity
  const overlappingCount = await tx.booking.count({
    where: {
      drivewayId,
      status: { in: ['PENDING', 'CONFIRMED'] },
      AND: [
        { startTime: { lt: end } },
        { endTime: { gt: start } }
      ]
    }
  });
  
  if (overlappingCount >= capacity) {
    throw new Error('CAPACITY_EXCEEDED');
  }
  
  // Create booking
  return tx.booking.create({ ... });
});
```

### 2. Authentication Middleware
```typescript
export async function verifyAuth(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  if (!token) return { success: false };
  
  const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
  return { success: true, userId: decoded.id };
}
```

### 3. API Error Handling
```typescript
try {
  // API logic
  return NextResponse.json(createApiResponse(data));
} catch (error) {
  return NextResponse.json(
    createApiError('Error message', 500, 'ERROR_CODE'),
    { status: 500 }
  );
}
```

### 4. Form Validation with Zod
```typescript
const bookingSchema = z.object({
  drivewayId: z.string(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  vehicleInfo: z.object({
    make: z.string(),
    model: z.string()
  })
});
```

---

## NUMBERS TO REMEMBER

- **Test Coverage**: 90%+
- **Total Tests**: 324 tests
- **API Endpoints**: 20+ routes
- **Database Models**: 5 models
- **Components**: 20+ reusable components
- **E2E Tests**: 42 tests
- **Bundle Size**: <200KB gzipped
- **Lighthouse Score**: 90+

---

## TECHNICAL TERMS TO EXPLAIN

### Monorepo
"A single repository containing multiple packages/apps. Benefits: code sharing, unified versioning, easier refactoring."

### Serverless
"Functions that run on-demand without managing servers. Benefits: auto-scaling, pay-per-use, no server management."

### JWT (JSON Web Token)
"Stateless authentication tokens containing user info. Benefits: scalable, no server-side session storage needed."

### Database Transaction
"Atomic operations that either all succeed or all fail. Prevents data inconsistency."

### ORM (Object-Relational Mapping)
"Prisma converts database queries to type-safe TypeScript code. Benefits: type safety, migrations, better DX."

### Webhook
"HTTP callbacks from external services (like Stripe). Used for async event processing."

---

## RED FLAGS TO AVOID

❌ "I don't know" (say "I haven't worked with that, but I'd approach it by...")
❌ Blaming others for problems
❌ Not being able to explain your code
❌ Overstating your role
❌ Not knowing your project's limitations
❌ Being defensive about code quality

---

## GREEN FLAGS TO SHOW

✅ Admitting what you don't know + showing how you'd learn
✅ Explaining trade-offs in your decisions
✅ Discussing what you'd improve
✅ Showing problem-solving process
✅ Being specific with examples
✅ Demonstrating learning mindset
✅ Understanding scalability concerns

---

## QUICK PREPARATION CHECKLIST

- [ ] Can explain project in 2 minutes
- [ ] Know all major technologies used
- [ ] Understand database schema
- [ ] Can explain authentication flow
- [ ] Know payment integration details
- [ ] Understand deployment process
- [ ] Can discuss testing strategy
- [ ] Know project limitations
- [ ] Have examples of challenges solved
- [ ] Can write code examples from memory

---

## COMMON FOLLOW-UP QUESTIONS

After any answer, be ready for:
- "Why did you do it that way?"
- "What would you do differently?"
- "How would you improve this?"
- "What are the trade-offs?"
- "How does this scale?"
- "What if [edge case]?"

---

**Remember**: Interviewers want to see your thought process, not just correct answers. Show how you think through problems!

