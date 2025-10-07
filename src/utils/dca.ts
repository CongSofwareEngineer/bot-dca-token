import { IDCATrade } from '@/models/DCATrade'
import { deepClone } from './functions'
import { IUser } from '@/models/User'
import { Token } from '@/services/token/type'
import { BigNumber } from 'bignumber.js'

const buyToken = async (item: IDCATrade, config: IUser, amountUSD: string, amountETH: string) => {
  const itemFinal = deepClone(item as IDCATrade)
  const configFinal = deepClone(config as IUser)

  itemFinal.isBuy = true
  itemFinal.buyAmountUSD = amountUSD

  configFinal.amountUSDToBuy = BigNumber(configFinal.amountUSDToBuy || 0)
    .plus(amountUSD)
    .toFixed()

  configFinal.amountETHBought = BigNumber(configFinal.amountETHBought || 0)
    .plus(amountETH)
    .toFixed()

  return { item: itemFinal, config: configFinal }
}

const sellToken = async (item: IDCATrade, config: IUser, amountUSD: string) => {
  const itemFinal = deepClone(item as IDCATrade)
  const configFinal = deepClone(config as IUser)

  itemFinal.isSell = true

  configFinal.amountUSDToBuy = '0'
  configFinal.amountETHBought = '0'
  //hoàn vốn ban đầu
  configFinal.capital = BigNumber(configFinal.capital || 0)
    .plus(amountUSD)
    .toFixed()

  return { item: itemFinal, config: configFinal }
}



const getRatePriceDrop = (currentPrice: number, minPrice: string, maxPrice: string) => {
  const rangePrice = BigNumber(maxPrice).minus(minPrice)
  let ratePriceDrop = BigNumber(1)
    .minus(BigNumber(BigNumber(currentPrice).minus(minPrice)).dividedBy(rangePrice))
    .abs()
    .toFixed()

  if (BigNumber(currentPrice).isLessThan(minPrice)) {
    ratePriceDrop = BigNumber(ratePriceDrop).plus(1).toFixed()
  }

  return ratePriceDrop
}


export const dcaV1 = async (item: IDCATrade, token: Token, userConfig: IUser) => {
  let itemFinal = deepClone(item as IDCATrade)
  let configFinal = deepClone(userConfig as IUser)
  let isStop = false
  let amountETHToBuy = '0'
  let amountUSDToBuy = '0'
  let isFirstBuy = false

  //nếu giá hiện tại < giá mua lần trước và <= giá max để dca thì mua
  if (BigNumber(token.price).isLessThan(configFinal.maxPrice) && !configFinal.isStop) {
    if (!configFinal.priceBuyHistory || BigNumber(configFinal.priceBuyHistory).isEqualTo(0)) {
      configFinal.priceBuyHistory = token.price.toString()
      isFirstBuy = true
    }

    //tính % giá giảm
    const ratePriceDropByRangeConfig = getRatePriceDrop(token.price, configFinal.minPrice, configFinal.maxPrice)
    const ratePriceDrop = BigNumber(BigNumber(token.price).minus(configFinal.priceBuyHistory).dividedBy(configFinal.priceBuyHistory)).abs().toNumber()

    //số tiền usd mua theo % giá giảm
    amountUSDToBuy = BigNumber(ratePriceDropByRangeConfig).multipliedBy(configFinal.stepSize).toFixed()

    //quy đổi sang ETH với trượt giá
    amountETHToBuy = BigNumber(amountUSDToBuy)
      .dividedBy(token.price)
      .multipliedBy(BigNumber(100 - Number(configFinal.slippageTolerance)).dividedBy(100))
      .toFixed()

    //mua lần đầu tiên
    if (isFirstBuy) {
      const { item: itemAfterBuy, config: configAfterBuy } = await buyToken(itemFinal, configFinal, amountUSDToBuy, amountETHToBuy)

      itemFinal = itemAfterBuy
      configFinal = configAfterBuy
    } else {
      if (BigNumber(configFinal.capital).isLessThan(configFinal.amountUSDToBuy)) {
        amountUSDToBuy = BigNumber(configFinal.capital).minus(configFinal.amountUSDToBuy).toFixed()
        amountETHToBuy = BigNumber(amountUSDToBuy)
          .dividedBy(token.price)
          .multipliedBy(BigNumber(100 - Number(configFinal.slippageTolerance)).dividedBy(100))
          .toFixed()

        isStop = true

        const { item: itemAfterBuy, config: configAfterBuy } = await buyToken(itemFinal, configFinal, amountUSDToBuy, amountETHToBuy)

        itemFinal = itemAfterBuy
        configFinal = configAfterBuy
      } else {
        if (BigNumber(token.price).isLessThanOrEqualTo(configFinal.priceBuyHistory)) {
          if (ratePriceDrop >= BigNumber(configFinal.ratioPriceByHistory || 1).dividedBy(100).toNumber()) {
            const { item: itemAfterBuy, config: configAfterBuy } = await buyToken(itemFinal, configFinal, amountUSDToBuy, amountETHToBuy)

            itemFinal = itemAfterBuy
            configFinal = configAfterBuy
          }
        } else {
          const priceAverage = BigNumber(configFinal.amountUSDToBuy).dividedBy(configFinal.amountETHBought).toString()
          const ratioPriceDrop = BigNumber(priceAverage).minus(token.price).dividedBy(priceAverage).abs().toNumber()

          if (BigNumber(token.price).isLessThan(priceAverage) && ratioPriceDrop >= BigNumber(configFinal.ratioPriceByHistory || 3).dividedBy(100).toNumber()) {
            const { item: itemAfterBuy, config: configAfterBuy } = await buyToken(itemFinal, configFinal, amountUSDToBuy, amountETHToBuy)

            itemFinal = itemAfterBuy
            configFinal = configAfterBuy
          }
        }
      }


    }



    configFinal.priceBuyHistory = token.price.toString()
  }

  if (itemFinal?.isBuy) {
    itemFinal.infoSwap = {
      from: 'USDT',
      to: 'ETH',
      amountIn: Number(amountUSDToBuy),
      amountOut: Number(amountETHToBuy)
    }
  }



  return { item: itemFinal, config: configFinal, isStop }
}

export const dcaV2 = async (item: IDCATrade, token: Token, userConfig: IUser) => {
  let itemFinal = deepClone(item as IDCATrade)
  let configFinal = deepClone(userConfig as IUser)
  const isStop = false
  let amountETHToBuy = '0'
  let amountUSDToBuy = '0'
  let isFirstBuy = false

  //lấy token cần mua

  if (BigNumber(token.price).isLessThan(configFinal.maxPrice) && !configFinal.isStop) {
    if (!configFinal.priceBuyHistory || BigNumber(configFinal.priceBuyHistory).isEqualTo(0)) {
      configFinal.priceBuyHistory = token.price.toString()
      isFirstBuy = true
    }

    //tính % giá giảm
    const ratePriceDropByRangeConfig = getRatePriceDrop(token.price, configFinal.minPrice, configFinal.maxPrice)

    //số tiền usd mua theo % giá giảm
    amountUSDToBuy = BigNumber(ratePriceDropByRangeConfig).multipliedBy(configFinal.stepSize).toFixed()

    //quy đổi sang ETH với trượt giá
    amountETHToBuy = BigNumber(amountUSDToBuy)
      .dividedBy(token.price)
      .multipliedBy(BigNumber(100 - Number(configFinal.slippageTolerance)).dividedBy(100))
      .toFixed()



    if (isFirstBuy) {
      const { item: itemAfterBuy, config: configAfterBuy } = await buyToken(itemFinal, configFinal, amountUSDToBuy, amountETHToBuy)

      itemFinal = itemAfterBuy
      configFinal = configAfterBuy
    } else {

      if (BigNumber(token.price).isLessThan(configFinal.priceBuyHistory)) {
        const { item: itemAfterBuy, config: configAfterBuy } = await buyToken(itemFinal, configFinal, amountUSDToBuy, amountETHToBuy)

        itemFinal = itemAfterBuy
        configFinal = configAfterBuy
      }

      if (BigNumber(token.price).gt(configFinal.priceBuyHistory)) {
        let priceAverage = '0'


        //nếu đã mua ETh thì mới tính giá trung bình
        if (BigNumber(configFinal.amountETHBought).gt(0)) {

          priceAverage = BigNumber(configFinal.amountUSDToBuy).dividedBy(configFinal.amountETHBought).toFixed()
        }



        if (BigNumber(token.price).isLessThan(priceAverage)) {
          const { item: itemAfterBuy, config: configAfterBuy } = await buyToken(itemFinal, configFinal, amountUSDToBuy, amountETHToBuy)

          itemFinal = itemAfterBuy
          configFinal = configAfterBuy
        }

        if (BigNumber(token.price).gt(priceAverage) && BigNumber(priceAverage).gt(0)) {

          const ratioPriceUp = BigNumber(1).minus(ratePriceDropByRangeConfig).toFixed()
          let amountUSDToSell = BigNumber(ratioPriceUp).multipliedBy(configFinal.stepSize).toFixed()
          let amountETHToSell = BigNumber(amountUSDToSell).dividedBy(token.price).toFixed()

          if (BigNumber(configFinal.amountETHBought).isLessThanOrEqualTo(BigNumber(amountETHToSell).plus(configFinal.amountUSDToBuy || 0))) {
            amountETHToSell = configFinal.amountETHBought
          }



          amountUSDToSell = BigNumber(amountETHToSell)
            .multipliedBy(token.price)
            .multipliedBy(BigNumber(100 - Number(configFinal.slippageTolerance)).dividedBy(100))
            .toFixed()




          configFinal.initialCapital = BigNumber(configFinal.initialCapital || 0)
            .plus(amountUSDToSell)
            .toFixed()

          configFinal.amountETHBought = BigNumber(configFinal.amountETHBought || 0)
            .minus(amountETHToSell)
            .toFixed()

          configFinal.amountUSDToBuy = BigNumber(configFinal.amountUSDToBuy || 0)
            .minus(amountUSDToSell)
            .toFixed()

          itemFinal.isSell = true
          itemFinal.infoSwap = {
            from: 'ETH',
            to: 'USDT',
            amountIn: Number(amountETHToSell),
            amountOut: Number(amountUSDToSell)
          }



        }
      }

    }



    configFinal.priceBuyHistory = token.price.toString()

  }

  if (itemFinal?.isBuy) {
    itemFinal.infoSwap = {
      from: 'USDT',
      to: 'ETH',
      amountIn: Number(amountUSDToBuy),
      amountOut: Number(amountETHToBuy)
    }
  }





  return { item: itemFinal, config: configFinal, isStop }
}

