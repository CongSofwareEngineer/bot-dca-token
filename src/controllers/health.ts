import { Request, Response } from 'express'

export const ping = async (_req: Request, res: Response): Promise<void> => {
  try {
    const uptime = process.uptime()
    const timestamp = new Date().toISOString()

    res.status(200).json({
      success: true,
      message: 'Server is alive',
      data: {
        status: 'healthy',
        timestamp,
        uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`,
        uptimeSeconds: Math.floor(uptime),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      }
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    res.status(500).json({
      success: false,
      message: 'Server health check failed',
      error: errorMessage
    })
  }
}

export const healthCheck = async (_req: Request, res: Response): Promise<void> => {
  try {
    // Basic health checks
    const checks = {
      server: 'healthy',
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    }

    // Check database connection (if needed)
    // You can add MongoDB connection check here

    res.status(200).json({
      success: true,
      message: 'Health check passed',
      data: {
        status: 'healthy',
        checks,
        version: process.env.npm_package_version || '1.0.0'
      }
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    res.status(503).json({
      success: false,
      message: 'Health check failed',
      error: errorMessage,
      data: {
        status: 'unhealthy',
        timestamp: new Date().toISOString()
      }
    })
  }
}