import { Request, Response } from 'express'
import TokenService from '@/services/token'
import Token from '@/models/Token'
import User, { IUser } from '@/models/User'
import DCATrade, { IDCATrade } from '@/models/DCATrade'
import { Token as TokenType } from '@/services/token/type'
import { checkToBuyByPrice } from '@/utils/dca'
import { isEqual } from 'lodash'

export const dca = async (_req: Request, res: Response): Promise<void> => {
  try {
    const idETH = '1027'
    const [token, user] = await Promise.all([
      Token.findOne({ tokenSymbol: 'ETH' }).exec(),
      User.findOne().exec()
    ])
    const price = await TokenService.getPrice(token?.idBinance || idETH)
    const item: IDCATrade = {
      createdAt: new Date(),
      idToken: token?._id.toString() || ''
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
      amountUSD: user?.amountUSD || '0',
      amountETHBought: user?.amountETHBought || '0',
      priceBuyHistory: user?.priceBuyHistory || '0',
      tokenInput: user?.tokenInput || 'ETH',
      ratioPriceUp: user?.ratioPriceUp || '0',
      isStop: user?.isStop || false

    }

    if (!token) {
      await Token.create({
        tokenSymbol: 'ETH',
        tokenAddress: '0x2170ed0880ac9a755fd29b2688956bd959f933f8',
        decimals: 18,
        idBinance: idETH
      })
    }

    if (!user) {
      await User.create(userConfig)
    }
    const result = await checkToBuyByPrice(item, tokenConfig, userConfig as any)

    const { item: itemResult, config: configResult } = result
    if (!isEqual(configResult, userConfig)) {
      await User.updateOne({ _id: user?._id }, { $set: configResult }).exec()
      console.log('Update user config')
    }

    await DCATrade.create(itemResult)


    res.status(200).json({ success: true, data: { result } })
  } catch (e: any) {
    res.status(500).json({ success: false, message: 'Failed to get plan', error: e.message })
  }
}


export const getDCAHistory = async (_req: Request, res: Response): Promise<void> => {
  try {
    const history = await DCATrade.find().sort({ createdAt: -1 }).limit(20).exec()
    res.status(200).json({ success: true, data: history })
  } catch (e: any) {
    res.status(500).json({ success: false, message: 'Failed to get plan', error: e.message })
  }
}

