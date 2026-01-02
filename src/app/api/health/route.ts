import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check if DATABASE_URL is set
    const hasDatabaseUrl = !!process.env.DATABASE_URL;
    
    let databaseStatus = 'unknown';
    let databaseError = null;
    let importError = null;
    
    if (hasDatabaseUrl) {
      try {
        // Try to import prisma module
        const dbModule = await import('@/lib/db');
        const { prisma } = dbModule;
        
        // Test database connection
        try {
          await prisma.$queryRaw`SELECT 1`;
          databaseStatus = 'connected';
        } catch (dbError) {
          databaseStatus = 'disconnected';
          databaseError = dbError instanceof Error ? dbError.message : 'Unknown database error';
          console.error('Database connection error:', dbError);
        }
      } catch (importErr) {
        databaseStatus = 'import_failed';
        importError = importErr instanceof Error ? importErr.message : 'Unknown import error';
        console.error('Failed to import db module:', importErr);
      }
    } else {
      databaseStatus = 'not_configured';
      databaseError = 'DATABASE_URL environment variable is not set';
    }
    
    return NextResponse.json({
      status: databaseStatus === 'connected' ? 'ok' : 'error',
      database: databaseStatus,
      error: databaseError || importError,
      env: {
        hasDatabaseUrl,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
        nodeEnv: process.env.NODE_ENV
      },
      timestamp: new Date().toISOString()
    }, { 
      status: databaseStatus === 'connected' ? 200 : 500 
    });
  } catch (error) {
    console.error('Health check failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json({
      status: 'error',
      database: 'unknown',
      error: errorMessage,
      stack: process.env.NODE_ENV === 'development' ? errorStack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

