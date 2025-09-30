import express from 'express'
import { dca, getDCAHistory } from '@/controllers/dcaStrategyController'

/**
 * @swagger
 * tags:
 *   name: DCA-Strategy
 *   description: Strategy-based ETH DCA endpoints
 */
/**
 * @swagger
 * /api/dca/dca-token:
 *   get:
 *     summary: Get current DCA plan
 *     tags: [DCA-Strategy]
 *     responses:
 *       200:
 *         description: Plan details
 */
/**
 * @swagger
 * /api/dca/dca-history:
 *   get:
 *     summary: Get DCA history
 *     tags: [DCA-Strategy]
 *     responses:
 *       200:
 *         description: Plan details
 */


// /**
//  * @swagger
//  * /api/dca/strategy/next:
//  *   get:
//  *     summary: Get next DCA recommendation
//  *     tags: [DCA-Strategy]
//  *     responses:
//  *       200:
//  *         description: Recommendation
//  */
// /**
//  * @swagger
//  * /api/dca/strategy/execute:
//  *   post:
//  *     summary: Execute recommended DCA step
//  *     tags: [DCA-Strategy]
//  *     responses:
//  *       200:
//  *         description: Execution result
//  */
// /**
//  * @swagger
//  * /api/dca/strategy/trades:
//  *   get:
//  *     summary: List recent executed trades
//  *     tags: [DCA-Strategy]
//  *     responses:
//  *       200:
//  *         description: Trades
//  */
// /**
//  * @swagger
//  * /api/dca/strategy/reset:
//  *   post:
//  *     summary: Reset plan and trades
//  *     tags: [DCA-Strategy]
//  *     responses:
//  *       200:
//  *         description: Plan reset
//  */

const router = express.Router()

// No auth required
router.get('/dca-token', dca)
router.get('/dca-history', getDCAHistory)


export default router
