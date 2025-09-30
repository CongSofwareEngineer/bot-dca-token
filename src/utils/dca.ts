import { IDCATrade } from '@/models/DCATrade'
import { deepClone } from './functions'
import { IUser } from '@/models/User'
import { Token } from '@/services/token/type'
import { BigNumber } from 'bignumber.js'

export const checkToBuyByPrice = (item: IDCATrade, token: Token, userConfig: IUser) => {
  const itemFinal = deepClone(item) as IDCATrade
  const configFinal = deepClone(userConfig) as IUser
  let amountETH = '0'

  //set gía mua lần đầu  với lần lấy giá đầu tiên


  //nếu giá hiện tại   <= giá max để dca thì mua
  if (BigNumber(token.price).isLessThan(configFinal.maxPrice)) {
    if (BigNumber(userConfig.priceBuyHistory).isEqualTo(0) || !userConfig.priceBuyHistory) {
      configFinal.priceBuyHistory = token.price.toString()
    }

    //nếu giá hiện tại < giá mua lần trước thì mua
    if (BigNumber(token.price).isLessThanOrEqualTo(configFinal.priceBuyHistory)) {
      //lấy khoảng giá giữa max và min để tính số tiền mua theo giá hiện tại
      const rangePrice = BigNumber(configFinal.maxPrice).minus(configFinal.minPrice)

      //so sánh giá hiện tại với khoảng giá min và max để tính % giá giảm
      let ratePriceDrop = BigNumber(1).minus(BigNumber(token.price).dividedBy(rangePrice)).multipliedBy(configFinal.stepSize).abs().toFixed()

      //nếu giá hiện tại < minPrice thì mua với số tiền = stepSize + % giá giảm(so voi khoảng giá min)
      if (BigNumber(token.price).isLessThan(configFinal.minPrice)) {
        ratePriceDrop = BigNumber(rangePrice).dividedBy(token.price).multipliedBy(configFinal.stepSize).toFixed()
      }

      //số tiền usd mua theo % giá giảm
      let amountUSD = BigNumber(ratePriceDrop).multipliedBy(configFinal.stepSize).dividedBy(100).toFixed()

      //quy đổi sang ETH với trượt giá
      amountETH = BigNumber(amountUSD)
        .dividedBy(token.price)
        .multipliedBy(BigNumber(100 - configFinal.slippageTolerance).dividedBy(100))
        .toFixed()

      //nếu số tiền mua > số tiền còn lại thì mua hết số tiền còn lại và dừng dca
      if (BigNumber(configFinal.initialCapital).isLessThan(configFinal.amountUSD)) {
        amountUSD = BigNumber(configFinal.initialCapital).minus(configFinal.amountUSD).toFixed()
        amountETH = BigNumber(amountUSD)
          .dividedBy(token.price)
          .multipliedBy(BigNumber(100 - configFinal.slippageTolerance).dividedBy(100))
          .toFixed()

        console.log('step 3')


        itemFinal.isSwap = true
        itemFinal.buyAmountUSD = amountUSD
        itemFinal.infoSwap = {
          from: 'USD',
          to: 'Token'
        }

        configFinal.amountETHBought = BigNumber(configFinal.amountETHBought || 0)
          .plus(amountETH)
          .toFixed()

        configFinal.amountUSD = BigNumber(configFinal.amountUSD || 0)
          .plus(amountUSD)
          .toFixed()
      } else {
        itemFinal.isSwap = true
        itemFinal.buyAmountUSD = amountUSD

        itemFinal.infoSwap = {
          from: 'USD',
          to: 'Token'
        }
        configFinal.amountETHBought = BigNumber(configFinal.amountETHBought || 0)
          .plus(amountETH)
          .toFixed()

        configFinal.amountUSD = BigNumber(configFinal.amountUSD || 0)
          .plus(amountUSD)
          .toFixed()
      }
    } else {
      const ratioPriceUp = BigNumber(token.price).dividedBy(configFinal.priceBuyHistory).minus(1).toFixed()
      const ratioPriceUpConfig = BigNumber(configFinal.ratioPriceUp).dividedBy(100).toFixed()

      //lên giá tăng và tăng > % giá tăng đã cấu hình thì bán hết
      if (BigNumber(ratioPriceUp).isGreaterThan(ratioPriceUpConfig) && BigNumber(configFinal.amountETHBought).isGreaterThan(0)) {
        const amountSellToUSD = BigNumber(configFinal.amountETHBought)
          .multipliedBy(token.price)
          .multipliedBy(BigNumber(100 - configFinal.slippageTolerance).dividedBy(100))
          .toFixed()

        itemFinal.infoSwap = {
          from: 'Token',
          to: 'USD'
        }
        itemFinal.isSwap = true

        configFinal.amountETHBought = '0'
        configFinal.amountUSD = '0'
        configFinal.initialCapital = BigNumber(configFinal.initialCapital || 0)
          .plus(amountSellToUSD)
          .toFixed()
      }

      configFinal.priceBuyHistory = token.price.toString()
    }
  }

  return { item: itemFinal, config: configFinal }
}