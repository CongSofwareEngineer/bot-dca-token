import express from 'express'
import { getPlan, nextRecommendation, executeStep, listTrades, resetPlan } from '@/controllers/dcaStrategyController'

/**
 * @swagger
 * tags:
 *   name: DCA-Strategy
 *   description: Strategy-based ETH DCA endpoints
 */
/**
 * @swagger
 * /api/dca/strategy/plan:
 *   get:
 *     summary: Get current DCA plan
 *     tags: [DCA-Strategy]
 *     responses:
 *       200:
 *         description: Plan details
 */
/**
 * @swagger
 * /api/dca/strategy/next:
 *   get:
 *     summary: Get next DCA recommendation
 *     tags: [DCA-Strategy]
 *     responses:
 *       200:
 *         description: Recommendation
 */
/**
 * @swagger
 * /api/dca/strategy/execute:
 *   post:
 *     summary: Execute recommended DCA step
 *     tags: [DCA-Strategy]
 *     responses:
 *       200:
 *         description: Execution result
 */
/**
 * @swagger
 * /api/dca/strategy/trades:
 *   get:
 *     summary: List recent executed trades
 *     tags: [DCA-Strategy]
 *     responses:
 *       200:
 *         description: Trades
 */
/**
 * @swagger
 * /api/dca/strategy/reset:
 *   post:
 *     summary: Reset plan and trades
 *     tags: [DCA-Strategy]
 *     responses:
 *       200:
 *         description: Plan reset
 */

const router = express.Router()

// No auth required
router.get('/plan', getPlan)
router.get('/next', nextRecommendation)
router.post('/execute', executeStep)
router.get('/trades', listTrades)
router.post('/reset', resetPlan)

export default router
