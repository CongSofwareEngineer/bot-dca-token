import express from 'express'
/**
 * @swagger
 * tags:
 *   name: DCA
 *   description: Generic DCA operations
 */
/**
 * @swagger
 * /api/dca/execute:
 *   post:
 *     summary: Execute a DCA transaction (placeholder)
 *     tags: [DCA]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tokenAddress, amount, targetTokenAddress]
 *             properties:
 *               tokenAddress: { type: string }
 *               targetTokenAddress: { type: string }
 *               amount: { type: string }
 *               slippage: { type: number }
 *     responses:
 *       200:
 *         description: Executed
 */
import {
  executeDCA,
  simulateDCA,
  getTokenBalance,
  getTokenPrice,
  getWalletInfo,
  batchDCA
} from '@/controllers/dcaController'

const router = express.Router()

// DCA Operations (không cần authentication)
router.post('/execute', executeDCA)
router.post('/simulate', simulateDCA)
router.post('/batch', batchDCA)

// Token Information
router.get('/token/:tokenAddress/balance', getTokenBalance)
router.get('/token/:tokenAddress/price', getTokenPrice)

// Wallet Information
router.get('/wallet', getWalletInfo)

export default router