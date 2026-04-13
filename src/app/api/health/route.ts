import { NextResponse } from 'next/server';

/**
 * GET /api/health
 *
 * Returns a simple health check response indicating the service is running.
 * Used by load balancers, container orchestrators, and monitoring tools.
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
}
