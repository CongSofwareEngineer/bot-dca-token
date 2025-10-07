import Token from '@/models/Token'
import User from '@/models/User'
import DCATrade, { IDCATrade } from '@/models/DCATrade'
import moment from 'moment'
import TokenService from '../token'
import { Token as TokenType } from '@/services/token/type'
import { dcaV1, dcaV2 } from '@/utils/dca'
import { isEqual } from 'lodash'

class DcaTokenService {
  private async getTokenDataAndPrice() {
    const idETH = '1027'
    const token = await Token.findOne({ tokenSymbol: 'ETH' }).exec()

    const tokenService = new TokenService()
    const price = await tokenService.getPrice(token?.idBinance || idETH)

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

    return { token, item, tokenConfig }
  }

  async executeDCA() {

    const [userV1, userV2, tokenDataAndPrice] = await Promise.all([
      User.findOne({ version: 1 }).exec(),
      User.findOne({ version: 2 }).exec(),
      this.getTokenDataAndPrice()
    ])

    const [lastHistoryV1, lastHistoryV2] = await Promise.all([
      DCATrade.findOne({
        idUser: userV1?._id?.toString() || 'default'
      }).sort({ createdAt: -1 }).exec(),
      DCATrade.findOne({
        idUser: userV2?._id?.toString() || 'default'
      }).sort({ createdAt: -1 }).exec()
    ])

    let isCheckV1 = true
    let isCheckV2 = true

    if (lastHistoryV1) {
      const now = moment(moment.now()).utc().valueOf()
      const current = moment(lastHistoryV1?.createdAt).utc().valueOf()
      // Different time intervals for different versions
      const timeInterval = 3.5 // v1: 3.5h
      const timeValid = moment(current).add(timeInterval, 'hours').isBefore(now)

      if (!timeValid) {
        isCheckV1 = false
      }
    } else {
      isCheckV1 = true
    }



    if (lastHistoryV2) {
      const now = moment(moment.now()).utc().valueOf()
      const current = moment(lastHistoryV2?.createdAt).utc().valueOf()
      // Different time intervals for different versions
      const timeInterval = 3.5 // v2: 3.9h
      const timeValid = moment(current).add(timeInterval, 'hours').isBefore(now)

      if (!timeValid) {
        isCheckV2 = false
      }
    } else {
      isCheckV2 = true
    }

    console.log({ isCheckV1, isCheckV2, lastHistoryV1, lastHistoryV2, tokenDataAndPrice })


    if (isCheckV1 && userV1) {
      const result = await dcaV1(tokenDataAndPrice.item, tokenDataAndPrice.tokenConfig, userV1 as any)

      const { item: itemResult, config: configResult } = result

      if (!isEqual(configResult, userV1)) {
        await User.updateOne({ _id: userV1?._id }, { $set: configResult }).exec()
      }

      await DCATrade.create({
        ...itemResult,
        idUser: userV1?._id.toString() || 'default'
      })
    }

    if (isCheckV2 && userV2) {
      const result = await dcaV2(tokenDataAndPrice.item, tokenDataAndPrice.tokenConfig, userV2 as any)

      const { item: itemResult, config: configResult } = result

      if (!isEqual(configResult, userV2)) {
        await User.updateOne({ _id: userV2?._id }, { $set: configResult }).exec()
      }
      await DCATrade.create({
        ...itemResult,
        idUser: userV2?._id.toString() || 'default'
      })
    }

    return { executedV1: isCheckV1 && !!userV1, executedV2: isCheckV2 && !!userV2 }

  }

  async dcaTokenV1() {
    const user = await User.findOne({ version: 1 }).exec()

    const lastHistory = await DCATrade.findOne({
      idUser: user?._id?.toString() || 'default'
    }).sort({ createdAt: -1 }).exec()

    if (lastHistory) {
      const now = moment(moment.now()).utc().valueOf()
      const current = moment(lastHistory?.createdAt).utc().valueOf()
      const timeValid = moment(current).add(3.5, 'hours').isBefore(now)

      if (!timeValid) {
        throw new Error('Wait for the next DCA time')
      }
    }

    // Use shared method to get token data and price
    const { item, tokenConfig } = await this.getTokenDataAndPrice()

    const result = await dcaV1(item, tokenConfig, user as any)

    const { item: itemResult, config: configResult } = result

    if (!isEqual(configResult, user)) {
      await User.updateOne({ _id: user?._id }, { $set: configResult }).exec()
    }

    await DCATrade.create({
      ...itemResult,
      idUser: user?._id.toString() || 'default'
    })
    return result
  }

  async dcaTokenV2() {
    const user = await User.findOne({ version: 2 }).exec()

    const lastHistory = await DCATrade.findOne({
      idUser: user?._id?.toString() || 'default'
    }).sort({ createdAt: -1 }).exec()

    if (lastHistory) {
      const now = moment(moment.now()).utc().valueOf()
      const current = moment(lastHistory?.createdAt).utc().valueOf()
      const timeValid = moment(current).add(3.5, 'hours').isBefore(now)

      if (!timeValid) {
        throw new Error('Wait for the next DCA time')
      }
    }

    // Use shared method to get token data and price
    const { item, tokenConfig } = await this.getTokenDataAndPrice()

    const result = await dcaV2(item, tokenConfig, user as any)

    const { item: itemResult, config: configResult } = result

    if (!isEqual(configResult, user)) {
      await User.updateOne({ _id: user?._id }, { $set: configResult }).exec()
    }

    await DCATrade.create({
      ...itemResult,
      idUser: user?._id.toString() || 'default'
    })
    return result
  }

}


export default DcaTokenService