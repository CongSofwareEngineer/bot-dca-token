import Token from '@/models/Token'
import User from '@/models/User'
import DCATrade, { IDCATrade } from '@/models/DCATrade'
import moment from 'moment'
import TokenService from '../token'
import { Token as TokenType } from '@/services/token/type'
import { dcaV1, dcaV2 } from '@/utils/dca'
import { isEqual } from 'lodash'

class DcaTokenService {
  async dcaTokenV1() {

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
        throw new Error('Wait for the next DCA time')

      }
    }


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
        throw new Error('Wait for the next DCA time')

      }
    }


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