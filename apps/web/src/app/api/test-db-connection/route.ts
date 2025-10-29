import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('🔍 Testing database connection details...');
    
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      return NextResponse.json({
        success: false,
        message: 'DATABASE_URL not found',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
    
    // Parse the database URL to check its components
    const url = new URL(dbUrl);
    const connectionInfo = {
      protocol: url.protocol,
      hostname: url.hostname,
      port: url.port,
      database: url.pathname.substring(1),
      username: url.username,
      hasPassword: !!url.password,
      fullUrl: dbUrl.replace(/:[^:@]+@/, ':***@') // Hide password
    };
    
    console.log('Database connection info:', connectionInfo);
    
    // Test if we can resolve the hostname
    try {
      const dns = require('dns');
      const { promisify } = require('util');
      const lookup = promisify(dns.lookup);
      
      const address = await lookup(url.hostname);
      console.log('DNS resolution successful:', address);
      
      return NextResponse.json({
        success: true,
        message: 'Database connection info retrieved',
        data: {
          ...connectionInfo,
          dnsResolution: address,
          timestamp: new Date().toISOString()
        }
      });
      
    } catch (dnsError) {
      console.error('DNS resolution failed:', dnsError);
      return NextResponse.json({
        success: false,
        message: 'DNS resolution failed',
        error: dnsError instanceof Error ? dnsError.message : 'Unknown DNS error',
        data: connectionInfo,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    return NextResponse.json({
      success: false,
      message: 'Database connection test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
