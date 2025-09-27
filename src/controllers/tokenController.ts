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

export const getTokens = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId
    const { page = 1, limit = 10, isActive } = req.query

    const filter: any = { userId }
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true'
    }

    const tokens = await Token.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit))

    const total = await Token.countDocuments(filter)

    res.status(200).json({
      success: true,
      message: 'Tokens retrieved successfully',
      data: {
        tokens,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving tokens',
      error: error.message
    })
  }
}

export const getTokenById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId
    const { id } = req.params

    const token = await Token.findOne({ _id: id, userId })

    if (!token) {
      res.status(404).json({
        success: false,
        message: 'Token not found'
      })
      return
    }

    res.status(200).json({
      success: true,
      message: 'Token retrieved successfully',
      data: { token }
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving token',
      error: error.message
    })
  }
}

export const updateToken = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId
    const { id } = req.params
    const updateData = req.body

    // If price or amount is updated, recalculate totalValue
    if (updateData.price || updateData.amount) {
      const existingToken = await Token.findOne({ _id: id, userId })
      if (existingToken) {
        const newPrice = updateData.price || existingToken.price
        const newAmount = updateData.amount || existingToken.amount
        updateData.totalValue = newPrice * newAmount
      }
    }

    const token = await Token.findOneAndUpdate({ _id: id, userId }, updateData, {
      new: true,
      runValidators: true
    })

    if (!token) {
      res.status(404).json({
        success: false,
        message: 'Token not found'
      })
      return
    }

    res.status(200).json({
      success: true,
      message: 'Token updated successfully',
      data: { token }
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Server error while updating token',
      error: error.message
    })
  }
}

export const deleteToken = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId
    const { id } = req.params

    const token = await Token.findOneAndDelete({ _id: id, userId })

    if (!token) {
      res.status(404).json({
        success: false,
        message: 'Token not found'
      })
      return
    }

    res.status(200).json({
      success: true,
      message: 'Token deleted successfully'
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Server error while deleting token',
      error: error.message
    })
  }
}

export const toggleTokenStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId
    const { id } = req.params

    const token = await Token.findOne({ _id: id, userId })

    if (!token) {
      res.status(404).json({
        success: false,
        message: 'Token not found'
      })
      return
    }

    token.isActive = !token.isActive
    await token.save()

    res.status(200).json({
      success: true,
      message: `Token ${token.isActive ? 'activated' : 'deactivated'} successfully`,
      data: { token }
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Server error while toggling token status',
      error: error.message
    })
  }
}
