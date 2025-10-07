import express from 'express'
import Pool from '@/services/pool'
import { TOKEN } from '@/constants/token'

const router = express.Router()

/**
 * @swagger
 * /api/weth/unwrap:
 *   post:
 *     summary: Unwrap WETH to native ETH
 *     tags: [WETH]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - chainId
 *               - amountWETH
 *             properties:
 *               chainId:
 *                 type: number
 *                 enum: [56, 8453]
 *                 description: Chain ID (56 for BSC, 8453 for Base)
 *                 example: 8453
 *               amountWETH:
 *                 type: string
 *                 description: Amount of WETH to unwrap (in decimal format)
 *                 example: "0.1"
 *               recipient:
 *                 type: string
 *                 description: Optional recipient address
 *                 example: "0x742d35Cc7651C4cD3b4C4900..."
 *     responses:
 *       200:
 *         description: WETH successfully unwrapped to ETH
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     tx:
 *                       type: string
 *                       description: Transaction hash
 *                       example: "0xabc123..."
 *                     wethAddress:
 *                       type: string
 *                       description: WETH contract address
 *                       example: "0x4200000000000000000000000000000000000006"
 *                     amountWETH:
 *                       type: string
 *                       description: Amount unwrapped
 *                       example: "0.1"
 *                     message:
 *                       type: string
 *                       description: Success message
 *                       example: "Successfully unwrapped 0.1 WETH to ETH"
 *       400:
 *         description: Invalid parameters or insufficient balance
 *       500:
 *         description: Server error
 */
router.post('/unwrap', async (req, res) => {
  try {
    const { chainId, amountWETH, recipient } = req.body

    if (!chainId || !amountWETH) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: chainId, amountWETH'
      })
    }

    if (![56, 8453].includes(chainId)) {
      return res.status(400).json({
        success: false,
        message: 'Unsupported chainId. Use 56 (BSC) or 8453 (Base)'
      })
    }

    // Get WETH address for the chain (ETH token is actually WETH)
    const chainIdKey = chainId as keyof typeof TOKEN
    const wethAddress = TOKEN[chainIdKey]?.ETH?.address

    if (!wethAddress) {
      return res.status(400).json({
        success: false,
        message: `WETH (ETH token) not configured for chain ${chainId}`
      })
    }

    const pool = new Pool(chainId)
    const result = await pool.unwrapWETHToETH({
      wethAddress,
      amountWETH,
      recipient
    })

    return res.json({
      success: true,
      data: result
    })
  } catch (error: unknown) {
    console.error('WETH unwrap error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to unwrap WETH'
    return res.status(500).json({
      success: false,
      message: errorMessage
    })
  }
})

/**
 * @swagger
 * /api/weth/wrap:
 *   post:
 *     summary: Wrap native ETH to WETH
 *     tags: [WETH]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - chainId
 *               - amountETH
 *             properties:
 *               chainId:
 *                 type: number
 *                 enum: [56, 8453]
 *                 description: Chain ID (56 for BSC, 8453 for Base)
 *                 example: 8453
 *               amountETH:
 *                 type: string
 *                 description: Amount of ETH to wrap (in decimal format)
 *                 example: "0.1"
 *     responses:
 *       200:
 *         description: ETH successfully wrapped to WETH
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     tx:
 *                       type: string
 *                       description: Transaction hash
 *                       example: "0xabc123..."
 *                     wethAddress:
 *                       type: string
 *                       description: WETH contract address
 *                       example: "0x4200000000000000000000000000000000000006"
 *                     amountETH:
 *                       type: string
 *                       description: Amount wrapped
 *                       example: "0.1"
 *                     message:
 *                       type: string
 *                       description: Success message
 *                       example: "Successfully wrapped 0.1 ETH to WETH"
 *       400:
 *         description: Invalid parameters or insufficient balance
 *       500:
 *         description: Server error
 */
router.post('/wrap', async (req, res) => {
  try {
    const { chainId, amountETH } = req.body

    if (!chainId || !amountETH) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: chainId, amountETH'
      })
    }

    if (![56, 8453].includes(chainId)) {
      return res.status(400).json({
        success: false,
        message: 'Unsupported chainId. Use 56 (BSC) or 8453 (Base)'
      })
    }

    // Get WETH address for the chain (ETH token is actually WETH)
    const chainIdKey = chainId as keyof typeof TOKEN
    const wethAddress = TOKEN[chainIdKey]?.ETH?.address

    if (!wethAddress) {
      return res.status(400).json({
        success: false,
        message: `WETH (ETH token) not configured for chain ${chainId}`
      })
    }

    const pool = new Pool(chainId)
    const result = await pool.wrapETHToWETH({
      wethAddress,
      amountETH
    })

    return res.json({
      success: true,
      data: result
    })
  } catch (error: unknown) {
    console.error('WETH wrap error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to wrap ETH'
    return res.status(500).json({
      success: false,
      message: errorMessage
    })
  }
})

/**
 * @swagger
 * /api/weth/swap-to-eth:
 *   post:
 *     summary: Swap USDT to ETH (via WETH with optional unwrapping)
 *     tags: [WETH]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - chainId
 *               - amountUSDT
 *               - fee
 *             properties:
 *               chainId:
 *                 type: number
 *                 enum: [56, 8453]
 *                 description: Chain ID (56 for BSC, 8453 for Base)
 *                 example: 8453
 *               amountUSDT:
 *                 type: string
 *                 description: Amount of USDT to swap (in decimal format)
 *                 example: "100"
 *               fee:
 *                 type: number
 *                 enum: [500, 3000, 10000]
 *                 description: Pool fee tier in basis points
 *                 example: 3000
 *               unwrapToETH:
 *                 type: boolean
 *                 description: Whether to unwrap WETH to native ETH after swap
 *                 example: true
 *               slippageBps:
 *                 type: number
 *                 description: Slippage tolerance in basis points (default 300 = 3%)
 *                 example: 300
 *               amountOutMinimum:
 *                 type: string
 *                 description: Minimum amount of WETH/ETH to receive
 *                 example: "0.02"
 *     responses:
 *       200:
 *         description: Successfully swapped USDT to ETH/WETH
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     swapTx:
 *                       type: object
 *                       description: Swap transaction details
 *                     unwrapTx:
 *                       type: object
 *                       description: Unwrap transaction details (if unwrapToETH=true)
 *                     finalToken:
 *                       type: string
 *                       description: Final token received
 *                       example: "ETH"
 *                     message:
 *                       type: string
 *                       description: Success message
 *                       example: "Successfully swapped 100 USDT to ETH"
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Server error
 */
router.post('/swap-to-eth', async (req, res) => {
  try {
    const {
      chainId,
      amountUSDT,
      fee,
      unwrapToETH = true,
      slippageBps = 300,
      amountOutMinimum = '0'
    } = req.body

    if (!chainId || !amountUSDT || !fee) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: chainId, amountUSDT, fee'
      })
    }

    if (![56, 8453].includes(chainId)) {
      return res.status(400).json({
        success: false,
        message: 'Unsupported chainId. Use 56 (BSC) or 8453 (Base)'
      })
    }

    if (![500, 3000, 10000].includes(fee)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid fee tier. Use 500, 3000, or 10000'
      })
    }

    // Get token addresses for the chain (ETH token is actually WETH)
    const chainIdKey = chainId as keyof typeof TOKEN
    const usdtAddress = TOKEN[chainIdKey]?.USDT?.address
    const wethAddress = TOKEN[chainIdKey]?.ETH?.address

    if (!usdtAddress || !wethAddress) {
      return res.status(400).json({
        success: false,
        message: `USDT or WETH (ETH token) not configured for chain ${chainId}`
      })
    }

    const pool = new Pool(chainId)

    // Get pool address
    const poolAddress = await pool.getPoolAddress({
      chainId,
      tokenA: usdtAddress,
      tokenB: wethAddress,
      fee
    })

    // Get token decimals
    const usdtDecimals = await pool.getDecimals(usdtAddress)
    const wethDecimals = await pool.getDecimals(wethAddress)

    // Determine token order
    const isUSDTToken0 = usdtAddress.toLowerCase() < wethAddress.toLowerCase()

    const result = await pool.swapUSDTToETH({
      poolAddress,
      usdtAddress,
      wethAddress,
      fee,
      amountUSDT,
      slippageBps,
      isUSDTToken0,
      usdtDecimals,
      wethDecimals,
      amountOutMinimum,
      unwrapToETH
    })

    return res.json({
      success: true,
      data: result
    })
  } catch (error: unknown) {
    console.error('USDT to ETH swap error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to swap USDT to ETH'
    return res.status(500).json({
      success: false,
      message: errorMessage
    })
  }
})

export default router