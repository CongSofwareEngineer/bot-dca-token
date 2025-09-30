import { Response } from 'express'
import Token from '@/models/Token'
import { AuthRequest } from '@/middleware/auth'

export const createToken = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId
    const { tokenAddress, tokenName, tokenSymbol, price, amount, dcaAmount, dcaFrequency } =
      req.body

    // Calculate total value
    const totalValue = price * amount

    const token = new Token({
      userId,
      tokenAddress,
      tokenName,
      tokenSymbol,
      price,
      amount,
      totalValue,
      dcaAmount,
      dcaFrequency
    })

    await token.save()

    res.status(201).json({
      success: true,
      message: 'Token created successfully',
      data: { token }
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Server error while creating token',
      error: error.message
    })
  }
}

