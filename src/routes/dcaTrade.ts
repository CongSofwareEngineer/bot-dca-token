import express from 'express'
import { dcaTokenV1, dcaTokenV2, getDCAHistory, getDCAHistoryByUserId, clearAllDCAHistory } from '@/controllers/dcaTrade'

/**
 * @swagger
 * tags:
 *   name: DCA-Strategy
 *   description: Strategy-based ETH DCA endpoints
 */
/**
 * @swagger
 * /api/dca/dca-v1:
 *   get:
 *     summary: Get current DCA plan
 *     tags: [DCA-Strategy]
 *     responses:
 *       200:
 *         description: Plan details
 */
/**
 * @swagger
 * /api/dca/dca-v2:
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
/**
 * @swagger
 * /api/dca/dca-history/{idUser}:
 *   get:
 *     summary: Get DCA history by user ID
 *     tags: [DCA-Strategy]
 *     parameters:
 *       - in: path
 *         name: idUser
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to get DCA history for
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of trades per page
 *     responses:
 *       200:
 *         description: DCA history retrieved successfully
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
 *                   example: "DCA history retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     history:
 *                       type: array
 *                       items:
 *                         type: object
 *                         description: DCA trade object
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                           example: 1
 *                         totalPages:
 *                           type: integer
 *                           example: 5
 *                         totalTrades:
 *                           type: integer
 *                           example: 100
 *                         hasNextPage:
 *                           type: boolean
 *                           example: true
 *                         hasPrevPage:
 *                           type: boolean
 *                           example: false
 *       400:
 *         description: Bad request - User ID is required
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
 *                   example: "User ID is required"
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
 *                   example: "Failed to get DCA history by user ID"
 *                 error:
 *                   type: string
 *                   example: "Error message"
 */
/**
 * @swagger
 * /api/dca/dca-history/clear-all:
 *   delete:
 *     summary: Clear all DCA history
 *     tags: [DCA-Strategy]
 *     description: Delete all DCA trade records from the database. This action is irreversible.
 *     responses:
 *       200:
 *         description: All DCA history cleared successfully
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
 *                   example: "All DCA history cleared successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     deletedCount:
 *                       type: integer
 *                       description: Number of records deleted
 *                       example: 150
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
 *                   example: "Failed to clear DCA history"
 *                 error:
 *                   type: string
 *                   example: "Error message"
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
router.get('/dca-v1', dcaTokenV1)
router.get('/dca-v2', dcaTokenV2)
router.get('/dca-history', getDCAHistory)
router.get('/dca-history/:idUser', getDCAHistoryByUserId)
router.delete('/dca-history/clear-all', clearAllDCAHistory)


export default router
