import { Request, Response } from 'express'
import TokenService from '@/services/token'
import Token from '@/models/Token'
import User, { IUser } from '@/models/User'
import DCATrade, { IDCATrade } from '@/models/DCATrade'
import { Token as TokenType } from '@/services/token/type'
import { dcaV1, dcaV2 } from '@/utils/dca'
import { isEqual } from 'lodash'
import moment from 'moment'

export const dcaTokenV1 = async (_req: Request, res: Response): Promise<void> => {
  try {
    const idETH = '1027'
    const [token, user] = await Promise.all([
      Token.findOne({ tokenSymbol: 'ETH' }).exec(),
      User.findOne({ version: 1 }).exec()

    ])

    const lastHistory = await DCATrade.findOne({
      idUser: user?._id?.toString() || 'default'
    }).sort({ createdAt: -1 }).exec()

    if (lastHistory) {
      const now = moment(moment.now()).utc().valueOf()
      const current = moment(lastHistory?.createdAt).utc().valueOf()
      const timeValid = moment(current).add(3.5, 'hours').isBefore(now)

      if (!timeValid) {
        res.status(200).json({ success: true, data: { result: { timeValid, current, lastHistory, now } } })
        return

      }
    }



    const price = await TokenService.getPrice(token?.idBinance || idETH)
    const item: IDCATrade = {
      createdAt: new Date(),
      idToken: token?._id.toString() || '',
      price: price.price.toString()
    }
    const tokenConfig: TokenType = {
      decimals: token?.decimals || 18,
      price: price.price || 0,
      tokenAddress: token?.tokenAddress || '',
      tokenSymbol: token?.tokenSymbol || 'ETH'
    }


    const userConfig: IUser = {
      stepSize: user?.stepSize || '10',
      slippageTolerance: user?.slippageTolerance || 1,
      maxPrice: user?.maxPrice || '0',
      minPrice: user?.minPrice || '0',
      initialCapital: user?.initialCapital || '100',
      capital: user?.capital || '0',
      priceBuyHistory: user?.priceBuyHistory || '0',
      tokenInput: user?.tokenInput || 'ETH',
      isStop: user?.isStop || false,
      version: 1,

      // Current total USD amount invested
      amountUSDToBuy: user?.amountUSDToBuy || '0',
      amountETHBought: user?.amountETHBought || '0',
      // Amount in USD to buy each interval
      ratioPriceUp: user?.ratioPriceUp || '0',
      ratioPriceDown: user?.ratioPriceDown || '1'

    }


    const result = dcaV1(item, tokenConfig, userConfig as any)

    const { item: itemResult, config: configResult } = result

    if (!isEqual(configResult, userConfig)) {
      await User.updateOne({ _id: user?._id }, { $set: configResult }).exec()
    }

    await DCATrade.create({
      ...itemResult,
      idUser: user?._id.toString() || 'default'
    })

    // Remove any unwanted fields from result before sending response


    res.status(200).json({ success: true, data: { result } })
  } catch (e: any) {
    res.status(500).json({ success: false, message: 'Failed to get plan', error: e.message })
  }
}


export const dcaTokenV2 = async (_req: Request, res: Response): Promise<void> => {
  try {
    const idETH = '1027'
    const [token, user] = await Promise.all([
      Token.findOne({ tokenSymbol: 'ETH' }).exec(),
      User.findOne({ version: 2 }).exec()
    ])

    const lastHistory = await DCATrade.findOne({
      idUser: user?._id?.toString() || 'default'
    }).sort({ createdAt: -1 }).exec()

    if (lastHistory) {
      console.log({ lastHistory })

      const now = moment(moment.now()).utc().valueOf()
      const current = moment(lastHistory?.createdAt).utc().valueOf()
      const timeValid = moment(current).add(3.9, 'hours').isBefore(now)
      if (!timeValid) {
        res.status(200).json({ success: true, data: { result: { timeValid, current, lastHistory, now } } })
        return

      }
    }




    const price = await TokenService.getPrice(token?.idBinance || idETH)
    const item: IDCATrade = {
      createdAt: new Date(),
      idToken: token?._id.toString() || '',
      price: price.price.toString()
    }
    const tokenConfig: TokenType = {
      decimals: token?.decimals || 18,
      price: price.price || 0,
      tokenAddress: token?.tokenAddress || '',
      tokenSymbol: token?.tokenSymbol || 'ETH'
    }


    const userConfig: IUser = {
      stepSize: user?.stepSize || '10',
      slippageTolerance: user?.slippageTolerance || 1,
      maxPrice: user?.maxPrice || '0',
      minPrice: user?.minPrice || '0',
      initialCapital: user?.initialCapital || '100',
      capital: user?.capital || '0',
      priceBuyHistory: user?.priceBuyHistory || '0',
      tokenInput: user?.tokenInput || 'ETH',
      isStop: user?.isStop || false,
      version: user?.version || 2,

      // Current total USD amount invested
      amountUSDToBuy: user?.amountUSDToBuy || '0',
      amountETHBought: user?.amountETHBought || '0',
      // Amount in USD to buy each interval
      ratioPriceUp: user?.ratioPriceUp || '0',
      ratioPriceDown: user?.ratioPriceDown || '1'

    }


    const result = dcaV2(item, tokenConfig, userConfig as any)

    const { item: itemResult, config: configResult } = result

    if (!isEqual(configResult, userConfig)) {
      await User.updateOne({ _id: user?._id }, { $set: configResult }).exec()
    }

    await DCATrade.create({
      ...itemResult,
      idUser: user?._id.toString() || 'default'
    })

    // Remove any unwanted fields from result before sending response


    res.status(200).json({ success: true, data: { result } })
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

