import { Request, Response } from 'express'
import TokenService from '@/services/token'
import DCATrade from '@/models/DCATrade'
import { TOKEN } from '@/constants/token'
import { CHAIN_ID_SUPPORT } from '@/constants/chain'
import Pool from '@/services/pool'
import { convertBalanceToWei, convertWeiToBalance } from '@/utils/functions'
import { BigNumber } from 'bignumber.js'
import { Address, stringToHex, zeroAddress } from 'viem'
import DcaTokenService from '@/services/dcaToken'
import WalletService from '@/services/wallet'
import { base } from 'viem/chains'

export const dcaToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const dcaTokenService = new DcaTokenService()
    const result = await dcaTokenService.executeDCA()

    // Determine response message
    const message = 'DCA executed successfully'


    res.status(200).json({
      success: true,
      message,
      data: { result }
    })
  } catch (e: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to execute DCA',
      error: e.message
    })
  }
}

export const dcaTokenV1 = async (_req: Request, res: Response): Promise<void> => {
  try {

    const dcaTokenService = new DcaTokenService()
    const result = await dcaTokenService.dcaTokenV1()


    res.status(200).json({ success: true, data: { result } })
  } catch (e: any) {
    res.status(500).json({ success: false, message: 'Failed to get plan', error: e.message })
  }
}


export const dcaTokenV2 = async (_req: Request, res: Response): Promise<void> => {
  try {
    const dcaTokenService = new DcaTokenService()
    const result = await dcaTokenService.dcaTokenV2()


    res.status(200).json({ success: true, data: { result } })
  } catch (e: any) {
    res.status(500).json({ success: false, message: 'Failed to get plan', error: e.message })
  }
}

export const dcaTestPool = async (_req: Request, res: Response): Promise<void> => {
  try {
    const fee = 500
    const slippage = 0.75 // 0.75%
    const amountIn = '10'
    const chainId = base.id
    const tokenETH = TOKEN[CHAIN_ID_SUPPORT[chainId]].ETH!
    const tokenUSDT = TOKEN[CHAIN_ID_SUPPORT[chainId]].USDT!
    let token0: {
      address: Address
      decimals: number
    }
    let token1: {
      address: Address
      decimals: number
    }

    const pool = new Pool(chainId)
    const walletService = new WalletService(chainId)
    const tokenService = new TokenService(chainId)

    // First, get pool address to check token order
    const poolAddress = await pool.getPoolAddress({

      tokenA: tokenETH.address,
      tokenB: tokenUSDT.address,
      fee: 500 // or 3000, whatever fee tier exists
    })
    const poolState = await pool.getPoolState(poolAddress)
    const currentPoolPrice = pool.getCurrentPoolPrice({
      poolAddress,
      sqrtPriceX96: poolState.sqrtPriceX96,
      token0Decimals: poolState.token0Decimals,
      token1Decimals: poolState.token1Decimals

    })


    // nếu trong pool token 0 là USDT thì đổi chỗ token0, token1
    const isUSDTToken0 = poolState.token0.toLowerCase() === tokenUSDT.address.toLowerCase()
    if (isUSDTToken0) {
      token0 = {
        address: tokenUSDT.address,
        decimals: tokenUSDT.decimals
      }
      token1 = {
        address: tokenETH.address,
        decimals: tokenETH.decimals
      }
    } else {
      token0 = {
        address: tokenETH.address,
        decimals: tokenETH.decimals
      }
      token1 = {
        address: tokenUSDT.address,
        decimals: tokenUSDT.decimals
      }
    }
    const quoteExactIn = await pool.getQuoteExactIn({
      amountIn: convertBalanceToWei(amountIn, isUSDTToken0 ? token0.decimals : token1.decimals), // Swap 10 USDT for testing
      tokenIn: isUSDTToken0 ? token0.address : token1.address,
      tokenOut: isUSDTToken0 ? token1.address : token0.address,
      isUSDTToken0,
      fee
    })

    const amountOutMinimum = convertWeiToBalance(quoteExactIn?.amountOut.toString() || 0n, isUSDTToken0 ? token1.decimals : token0.decimals)

    console.log({ poolState, currentPoolPrice, quoteExactIn })


    // const [balanceUSDTWei, balanceETHWei] = await Promise.all([
    //   tokenService.getBalance(tokenUSDT.address),
    //   tokenService.getBalance(tokenETH.address)
    // ])
    // console.log('====================================')
    // console.log({ balanceUSDTWei, balanceETHWei,poolAddress })
    // console.log('====================================')

    // const balanceUSDT = convertWeiToBalance(balanceUSDTWei, tokenUSDT.decimals)
    // const balanceETH = convertWeiToBalance(balanceETHWei, tokenETH.decimals)

    // Execute actual swap: USDT → ETH
    const swapResult = await pool.swapUSDTToWETH({
      poolAddress,
      usdtAddress: tokenUSDT.address,
      wethAddress: tokenETH.address,
      fee: 500,
      amountUSDT: amountIn, // Swap 10 USDT for testing
      slippageBps: 75, // 0.75% slippage (75 basis points) - optimal for DCA consistency
      isUSDTToken0,
      wethDecimals: tokenETH.decimals,
      usdtDecimals: tokenUSDT.decimals,
      amountOutMinimum: amountOutMinimum
    })

    res.status(200).json({
      success: true,
      data: {
        priceETH: currentPoolPrice.price,
        poolInfo: {
          liquidity: poolState.liquidity.toString(),
          tick: poolState.tick.toString(),
          poolAddress,
          token0: poolState.token0Symbol,
          token1: poolState.token1Symbol,
          isUSDTToken0,
          token0Decimals: poolState.token0Decimals,
          token1Decimals: poolState.token1Decimals
        },
        currentPoolPrice,
        swapDirection: isUSDTToken0 ? 'USDT(token0) → ETH(token1)' : 'USDT(token1) → ETH(token0)'

      }
    })

  } catch (e: any) {
    res.status(500).json({ success: false, message: 'Failed to get plan', error: e.message })
  }
}


export const getDCAHistory = async (_req: Request, res: Response): Promise<void> => {
  try {
    const history = await DCATrade.find({})
      .select('-updatedAt -__v')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean()
      .exec()
    res.status(200).json({ success: true, data: history })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    res.status(500).json({ success: false, message: 'Failed to get plan', error: errorMessage })
  }
}

export const getDCAHistoryByUserId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idUser } = req.params
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const skip = (page - 1) * limit

    // Validate idUser parameter
    if (!idUser) {
      res.status(400).json({
        success: false,
        message: 'User ID is required'
      })
      return
    }

    const history = await DCATrade.find({ idUser })
      .select('-updatedAt -__v')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec()

    const totalTrades = await DCATrade.countDocuments({ idUser })
    const totalPages = Math.ceil(totalTrades / limit)

    res.status(200).json({
      success: true,
      message: 'DCA history retrieved successfully',
      data: {
        history,
        pagination: {
          currentPage: page,
          totalPages,
          totalTrades,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    res.status(500).json({
      success: false,
      message: 'Failed to get DCA history by user ID',
      error: errorMessage
    })
  }
}

export const clearAllDCAHistory = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await DCATrade.deleteMany({})

    res.status(200).json({
      success: true,
      message: 'All DCA history cleared successfully',
      data: {
        deletedCount: result.deletedCount
      }
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    res.status(500).json({
      success: false,
      message: 'Failed to clear DCA history',
      error: errorMessage
    })
  }
}

export const clearDCAHistoryByUserId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idUser } = req.params

    // Validate idUser parameter
    if (!idUser) {
      res.status(400).json({
        success: false,
        message: 'User ID is required'
      })
      return
    }

    // Count documents before deletion for confirmation
    const countBeforeDeletion = await DCATrade.countDocuments({ idUser })

    if (countBeforeDeletion === 0) {
      res.status(404).json({
        success: false,
        message: 'No DCA history found for this user'
      })
      return
    }

    // Delete all DCA history for the specific user
    const result = await DCATrade.deleteMany({ idUser })

    res.status(200).json({
      success: true,
      message: `DCA history cleared successfully for user ${idUser}`,
      data: {
        idUser,
        deletedCount: result.deletedCount,
        confirmedCount: countBeforeDeletion
      }
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    res.status(500).json({
      success: false,
      message: 'Failed to clear DCA history by user ID',
      error: errorMessage
    })
  }
}

