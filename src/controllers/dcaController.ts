import { Request, Response } from 'express'
import blockchainService from '@/services/blockchainService'
import { DCARequest } from '@/types'
import BigNumber from 'bignumber.js'

export const executeDCA = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tokenAddress, amount, targetTokenAddress, slippage } = req.body as DCARequest

    // Validation
    if (!tokenAddress || !amount || !targetTokenAddress) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: tokenAddress, amount, targetTokenAddress'
      })
      return
    }

    if (!new BigNumber(amount).isPositive()) {
      res.status(400).json({
        success: false,
        message: 'Amount must be positive'
      })
      return
    }

    // Execute DCA
    const result = await blockchainService.executeDCA({
      tokenAddress,
      amount,
      targetTokenAddress,
      slippage
    })

    res.status(200).json({
      success: true,
      message: 'DCA executed successfully',
      data: result
    })
  } catch (error: any) {
    console.error('DCA execution error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to execute DCA',
      error: error.message
    })
  }
}

export const simulateDCA = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tokenAddress, amount, targetTokenAddress, slippage } = req.body as DCARequest

    // Validation
    if (!tokenAddress || !amount || !targetTokenAddress) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: tokenAddress, amount, targetTokenAddress'
      })
      return
    }

    if (!new BigNumber(amount).isPositive()) {
      res.status(400).json({
        success: false,
        message: 'Amount must be positive'
      })
      return
    }

    // Simulate DCA
    const result = await blockchainService.simulateDCA({
      tokenAddress,
      amount,
      targetTokenAddress,
      slippage
    })

    res.status(200).json({
      success: true,
      message: 'DCA simulation completed',
      data: result
    })
  } catch (error: any) {
    console.error('DCA simulation error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to simulate DCA',
      error: error.message
    })
  }
}

export const getTokenBalance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tokenAddress } = req.params
    const { walletAddress } = req.query

    if (!tokenAddress) {
      res.status(400).json({
        success: false,
        message: 'Token address is required'
      })
      return
    }

    const balance = await blockchainService.getTokenBalance(
      tokenAddress, 
      walletAddress as string
    )
    
    const symbol = await blockchainService.getTokenSymbol(tokenAddress)

    res.status(200).json({
      success: true,
      message: 'Token balance retrieved successfully',
      data: {
        tokenAddress,
        symbol,
        balance,
        walletAddress: walletAddress || blockchainService.getWalletAddress()
      }
    })
  } catch (error: any) {
    console.error('Get balance error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get token balance',
      error: error.message
    })
  }
}

export const getTokenPrice = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tokenAddress } = req.params

    if (!tokenAddress) {
      res.status(400).json({
        success: false,
        message: 'Token address is required'
      })
      return
    }

    const tokenPrice = await blockchainService.getTokenPrice(tokenAddress)

    res.status(200).json({
      success: true,
      message: 'Token price retrieved successfully',
      data: tokenPrice
    })
  } catch (error: any) {
    console.error('Get token price error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get token price',
      error: error.message
    })
  }
}

export const getWalletInfo = async (req: Request, res: Response): Promise<void> => {
  try {
    const walletAddress = blockchainService.getWalletAddress()
    const gasPrice = await blockchainService.getGasPrice()
    
    // Get ETH balance
    const ethBalance = await blockchainService.getTokenBalance('0x0')

    res.status(200).json({
      success: true,
      message: 'Wallet info retrieved successfully',
      data: {
        address: walletAddress,
        ethBalance,
        gasPrice: `${gasPrice} ETH`,
        network: 'mainnet'
      }
    })
  } catch (error: any) {
    console.error('Get wallet info error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get wallet info',
      error: error.message
    })
  }
}

export const batchDCA = async (req: Request, res: Response): Promise<void> => {
  try {
    const { transactions } = req.body

    if (!Array.isArray(transactions) || transactions.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Transactions array is required'
      })
      return
    }

    const results = []
    
    for (const transaction of transactions) {
      try {
        const result = await blockchainService.executeDCA(transaction)
        results.push({
          success: true,
          transaction,
          result
        })
      } catch (error: any) {
        results.push({
          success: false,
          transaction,
          error: error.message
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    
    res.status(200).json({
      success: true,
      message: `Batch DCA completed: ${successCount}/${transactions.length} successful`,
      data: {
        totalTransactions: transactions.length,
        successfulTransactions: successCount,
        failedTransactions: transactions.length - successCount,
        results
      }
    })
  } catch (error: any) {
    console.error('Batch DCA error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to execute batch DCA',
      error: error.message
    })
  }
}