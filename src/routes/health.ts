import express from 'express'
import { ping, healthCheck } from '@/controllers/health'

/**
 * @swagger
 * tags:
 *   name: Health
 *   description: Server health monitoring endpoints
 */

/**
 * @swagger
 * /api/ping:
 *   get:
 *     summary: Simple ping to check if server is alive
 *     tags: [Health]
 *     description: Returns basic server status and uptime information
 *     responses:
 *       200:
 *         description: Server is alive and responding
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Server is alive"
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: "healthy"
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-10-06T12:00:00.000Z"
 *                     uptime:
 *                       type: string
 *                       example: "2h 30m 15s"
 *                     uptimeSeconds:
 *                       type: number
 *                       example: 9015
 *                     version:
 *                       type: string
 *                       example: "1.0.0"
 *                     environment:
 *                       type: string
 *                       example: "development"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Server health check failed"
 *                 error:
 *                   type: string
 *                   example: "Error message"
 */

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Comprehensive health check
 *     tags: [Health]
 *     description: Returns detailed server health information including memory usage and system checks
 *     responses:
 *       200:
 *         description: Health check passed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Health check passed"
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: "healthy"
 *                     checks:
 *                       type: object
 *                       properties:
 *                         server:
 *                           type: string
 *                           example: "healthy"
 *                         memory:
 *                           type: object
 *                           description: "Memory usage statistics"
 *                         uptime:
 *                           type: number
 *                           example: 9015
 *                         timestamp:
 *                           type: string
 *                           format: date-time
 *                     version:
 *                       type: string
 *                       example: "1.0.0"
 *       503:
 *         description: Health check failed - Service unavailable
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Health check failed"
 *                 error:
 *                   type: string
 *                   example: "Error message"
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: "unhealthy"
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 */

const router = express.Router()

// Health check endpoints
router.get('/ping', ping)
router.get('/health', healthCheck)

export default router