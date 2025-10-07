import { QUOTER_V2_ABI, V3_FACTORY_ABI, V3_POOL_ABI, V3_SWAP_ROUTER_ABI } from '@/abi/pool'
import { Address, encodeFunctionData, getAddress } from 'viem'
import { PoolState } from './type'
import web3 from '../web3'
import { ERC20_METADATA_ABI } from '@/abi/token'
import { base, bsc } from 'viem/chains'
import { DATA_UNISWAP } from '@/constants/pool'
import { TOKEN } from '@/constants/token'
import { CHAIN_ID_SUPPORT } from '@/constants/chain'
import { convertBalanceToWei } from '@/utils/functions'
import { BigNumber } from 'bignumber.js'

class Pool extends web3 {
  private getFactoryAddress(chainId: number): Address {
    // PancakeSwap V3 Factory addresses
    const mapping: Record<number, Address> = {
      [bsc.id]: DATA_UNISWAP[bsc.id].factoryAddress,
      [base.id]: DATA_UNISWAP[base.id].factoryAddress
    }
    return getAddress(mapping[chainId])
  }

  async getPoolAddress(params: {
    chainId?: number
    tokenA: string
    tokenB: string
    fee: number
  }): Promise<string> {
    const chainId = params.chainId || this.chainId
    const factoryAddress = this.getFactoryAddress(chainId)

    try {
      const poolAddress = await this.client.readContract({
        address: factoryAddress,
        abi: V3_FACTORY_ABI,
        functionName: 'getPool',
        args: [
          getAddress(params.tokenA),
          getAddress(params.tokenB),
          params.fee
        ]
      }) as `0x${string}`

      // Check if pool exists (address is not zero)
      if (poolAddress === '0x0000000000000000000000000000000000000000') {
        throw new Error(`Pool does not exist for tokens ${params.tokenA}/${params.tokenB} with fee ${params.fee}`)
      }

      return poolAddress
    } catch (error) {
      throw new Error(`Failed to get pool address: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }



  async getPoolState(poolAddress: string): Promise<PoolState> {
    const address = getAddress(poolAddress)
    const [slot0, token0, token1, liquidity] = await Promise.all([
      this.client.readContract({
        address,
        abi: V3_POOL_ABI,
        functionName: 'slot0'
      }) as Promise<[
        bigint, // sqrtPriceX96
        bigint | number, // tick (int24)
        number,
        number,
        number,
        number,
        boolean
      ]>,
      this.client.readContract({ address, abi: V3_POOL_ABI, functionName: 'token0' }) as Promise<`0x${string}`>,
      this.client.readContract({ address, abi: V3_POOL_ABI, functionName: 'token1' }) as Promise<`0x${string}`>,
      this.client.readContract({ address, abi: V3_POOL_ABI, functionName: 'liquidity' }) as Promise<bigint>
    ])

    const [
      token0Decimals, token1Decimals, token0Symbol, token1Symbol
    ] = await Promise.all([
      this.client.readContract({ address: token0, abi: ERC20_METADATA_ABI, functionName: 'decimals' }) as Promise<number>,
      this.client.readContract({ address: token1, abi: ERC20_METADATA_ABI, functionName: 'decimals' }) as Promise<number>,
      this.client.readContract({ address: token0, abi: ERC20_METADATA_ABI, functionName: 'symbol' }) as Promise<string>,
      this.client.readContract({ address: token1, abi: ERC20_METADATA_ABI, functionName: 'symbol' }) as Promise<string>
    ])



    return {
      sqrtPriceX96: slot0[0] as bigint,
      tick: Number(slot0[1]),
      liquidity,
      token0,
      token1,
      token0Decimals,
      token1Decimals,
      token0Symbol,
      token1Symbol
    }
  }

  async swapExactIn(params: {
    chainId?: number
    tokenIn: string
    tokenOut: string
    fee: number
    amountIn: string
    slippageBps?: number // basis points (e.g. 50 = 0.5%)
    recipient?: string
    sqrtPriceLimitX96?: string
  }) {
    if (!this.wallet) throw new Error('Wallet not initialized')
    const router = this.getRouterAddress()
    const account = (await this.wallet.getAddresses())[0]
    const amountInWei = BigInt(params.amountIn)
    const slippageBps = params.slippageBps ?? 50

    // For demo: set minimum out to 0 (or fetch a quote API to compute expectedOut * (1 - slippage))
    const amountOutMin = 0n

    await this.ensureAllowance(params.tokenIn, account, router, amountInWei)

    const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 10)

    const calldata = encodeFunctionData({
      abi: V3_SWAP_ROUTER_ABI,
      functionName: 'exactInputSingle',
      args: [
        {
          tokenIn: getAddress(params.tokenIn),
          tokenOut: getAddress(params.tokenOut),
          fee: params.fee,
          recipient: params.recipient ? getAddress(params.recipient) : account,
          deadline,
          amountIn: amountInWei,
          amountOutMinimum: amountOutMin,
          sqrtPriceLimitX96: params.sqrtPriceLimitX96 ? BigInt(params.sqrtPriceLimitX96) : 0n
        }
      ]
    })

    const hash = await this.wallet.sendTransaction({
      chain: this.wallet.chain,
      account,
      to: router,
      value: 0n,
      data: calldata
    })

    return {
      tx: hash,
      router,
      amountIn: params.amountIn,
      amountOutMin: amountOutMin.toString(),
      slippageBps
    }
  }

  async swapExactOut(params: {
    chainId?: number
    tokenIn: string
    tokenOut: string
    fee: number
    amountOut: string
    maxAmountIn: string
    recipient?: string
    sqrtPriceLimitX96?: string
  }) {
    if (!this.wallet) throw new Error('Wallet not initialized')
    const router = this.getRouterAddress()
    const account = (await this.wallet.getAddresses())[0]
    const amountOutWei = BigInt(params.amountOut)
    const maxAmountInWei = BigInt(params.maxAmountIn)

    await this.ensureAllowance(params.tokenIn, account, router, maxAmountInWei)

    const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 10)

    const calldata = encodeFunctionData({
      abi: V3_SWAP_ROUTER_ABI,
      functionName: 'exactOutputSingle',
      args: [
        {
          tokenIn: getAddress(params.tokenIn),
          tokenOut: getAddress(params.tokenOut),
          fee: params.fee,
          recipient: params.recipient ? getAddress(params.recipient) : account,
          deadline,
          amountOut: amountOutWei,
          amountInMaximum: maxAmountInWei,
          sqrtPriceLimitX96: params.sqrtPriceLimitX96 ? BigInt(params.sqrtPriceLimitX96) : 0n
        }
      ]
    })

    const hash = await this.wallet.sendTransaction({
      chain: this.wallet.chain,
      account,
      to: router,
      value: 0n,
      data: calldata
    })

    return { tx: hash, router, amountOut: params.amountOut, maxAmountIn: params.maxAmountIn }
  }

  async swapTokenToStable(params: {
    chainId?: number
    tokenIn: string // arbitrary token -> stable
    stable?: 'USDT'
    fee: number
    amountInDecimal: string
    slippageBps?: number
    recipient?: string
  }) {
    if (!this.wallet) throw new Error('Wallet not initialized')
    const chainId = params.chainId || this.chainId
    const stableSymbol = params.stable || 'USDT'
    const stableAddress = TOKEN[CHAIN_ID_SUPPORT[chainId]][stableSymbol]!.address
    if (!stableAddress) throw new Error(`Stable ${stableSymbol} not configured for chain ${chainId}`)
    const tokenDecimals = await this.getDecimals(params.tokenIn)
    const rawAmountIn = this.toRaw(params.amountInDecimal, tokenDecimals)
    return this.swapExactIn({
      chainId,
      tokenIn: params.tokenIn,
      tokenOut: stableAddress,
      fee: params.fee,
      amountIn: rawAmountIn.toString(),
      slippageBps: params.slippageBps,
      recipient: params.recipient
    })
  }

  async swapStableToToken(params: {
    chainId?: number
    stable?: 'USDT'
    tokenOut: string
    fee: number
    amountInDecimal: string
    slippageBps?: number
    recipient?: string
  }) {
    if (!this.wallet) throw new Error('Wallet not initialized')
    const chainId = params.chainId || this.chainId
    const stableSymbol = params.stable || 'USDT'
    const stableAddress = TOKEN[CHAIN_ID_SUPPORT[chainId]][stableSymbol]!.address
    if (!stableAddress) throw new Error(`Stable ${stableSymbol} not configured for chain ${chainId}`)
    const stableDecimals = await this.getDecimals(stableAddress)
    const rawAmountIn = this.toRaw(params.amountInDecimal, stableDecimals)
    return this.swapExactIn({
      chainId,
      tokenIn: stableAddress,
      tokenOut: params.tokenOut,
      fee: params.fee,
      amountIn: rawAmountIn.toString(),
      slippageBps: params.slippageBps,
      recipient: params.recipient
    })
  }

  async getQuoteExactIn(params: {
    tokenIn: string
    tokenOut: string
    fee: number
    amountIn: string
    sqrtPriceLimitX96?: string
    isUSDTToken0?: boolean
  }): Promise<{
    amountOut: number
    sqrtPriceX96After: number
    initializedTicksCrossed: number
    gasEstimate: number
  }> {
    const quoterAddress = DATA_UNISWAP[this.chainId].quoterV2

    const amountInWei = BigInt(params.amountIn)

    const res = await this.client.readContract({
      address: getAddress(quoterAddress),
      abi: QUOTER_V2_ABI,
      functionName: params?.isUSDTToken0 ? 'quoteExactOutputSingle' : 'quoteExactInputSingle',
      args: [{
        tokenIn: getAddress(params.tokenIn),
        tokenOut: getAddress(params.tokenOut),
        amountIn: amountInWei,
        fee: params.fee,
        sqrtPriceLimitX96: params.sqrtPriceLimitX96 ? BigInt(params.sqrtPriceLimitX96) : 0n
      }]
    })

    const [amountOut, sqrtPriceX96After, initializedTicksCrossed, gasEstimate] = res as unknown as [bigint, bigint, number, bigint]

    return {
      // res
      amountOut: Number(amountOut),
      sqrtPriceX96After: Number(sqrtPriceX96After),
      initializedTicksCrossed,
      gasEstimate: Number(gasEstimate)
    }
  }

  // Swap USDT to WETH with slippage protection based on current pool price

  async swapUSDTToWETH(params: {
    poolAddress: string
    usdtAddress: string
    wethAddress: string
    fee: number
    amountUSDT: string
    slippageBps?: number
    recipient?: string
    sqrtPriceLimitX96?: string
    isUSDTToken0: boolean
    usdtDecimals: number
    wethDecimals: number
    amountOutMinimum: string
  }) {
    if (!this.account || !this.wallet) throw new Error('Wallet not initialized')
    const router = this.getRouterAddress()
    const account = this.account.address as Address
    const amountInWei = BigInt(convertBalanceToWei(params.amountUSDT, params.usdtDecimals))
    const slippageBps = params.slippageBps ?? 50 // Default 0.5% slippage
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 10) // 10 minutes
    let amountOutMinimumWei = convertBalanceToWei(params.amountOutMinimum, params.wethDecimals)

    amountOutMinimumWei = BigNumber(amountOutMinimumWei).multipliedBy((10000 - slippageBps) / 10000).toFixed(0)

    console.log({
      isUSDTToken0: params.isUSDTToken0,
      tokenIn: getAddress(params.usdtAddress),
      tokenOut: getAddress(params.wethAddress),
      fee: params.fee,
      recipient: params.recipient ? getAddress(params.recipient) : account,
      deadline,
      amountIn: amountInWei,
      amountOutMinimumWei,
      sqrtPriceLimitX96: params.sqrtPriceLimitX96 ? BigInt(params.sqrtPriceLimitX96) : 0n
    })

    // Ensure USDT allowance for router
    await this.ensureAllowance(params.usdtAddress, account, router, amountInWei)

    const calldata = encodeFunctionData({
      abi: V3_SWAP_ROUTER_ABI,
      functionName: 'exactInputSingle',
      args: [
        {
          tokenIn: getAddress(params.usdtAddress),
          tokenOut: getAddress(params.wethAddress),
          fee: params.fee,
          recipient: params.recipient ? getAddress(params.recipient) : account,
          deadline,
          amountIn: amountInWei,
          amountOutMinimum: BigInt(amountOutMinimumWei),
          sqrtPriceLimitX96: params.sqrtPriceLimitX96 ? BigInt(params.sqrtPriceLimitX96) : 0n
        }
      ]
    })

    const hash = await this.wallet.sendTransaction({
      chain: this.wallet.chain,
      account,
      to: router as `0x${string}`,
      value: 0n,
      data: calldata
    })
    await this.trackingHash(hash)

    return hash
  }

  // Swap WETH to USDT (reverse direction)
  async swapWETHToUSDT(params: {
    poolAddress: string
    wethAddress: string
    usdtAddress: string
    fee: number
    amountWETH: string
    slippageBps?: number
    recipient?: string
    sqrtPriceLimitX96?: string
    isWETHToken0: boolean
    wethDecimals: number
    usdtDecimals: number
    amountOutMinimum: string
  }) {
    if (!this.wallet) throw new Error('Wallet not initialized')
    const router = this.getRouterAddress()
    const account = (await this.wallet.getAddresses())[0]
    const amountInWei = this.toRaw(params.amountWETH, params.wethDecimals)
    const slippageBps = params.slippageBps ?? 50 // Default 0.5% slippage
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 10) // 10 minutes
    let amountOutMinimumWei = convertBalanceToWei(params.amountOutMinimum, params.usdtDecimals)

    amountOutMinimumWei = BigNumber(amountOutMinimumWei).multipliedBy((10000 - slippageBps) / 10000).toFixed(0)

    console.log({
      isWETHToken0: params.isWETHToken0,
      tokenIn: getAddress(params.wethAddress),
      tokenOut: getAddress(params.usdtAddress),
      fee: params.fee,
      recipient: params.recipient ? getAddress(params.recipient) : account,
      deadline,
      amountIn: amountInWei,
      amountOutMinimumWei,
      sqrtPriceLimitX96: params.sqrtPriceLimitX96 ? BigInt(params.sqrtPriceLimitX96) : 0n
    })

    // Ensure WETH allowance for router
    await this.ensureAllowance(params.wethAddress, account, router, amountInWei)

    const calldata = encodeFunctionData({
      abi: V3_SWAP_ROUTER_ABI,
      functionName: 'exactInputSingle',
      args: [
        {
          tokenIn: getAddress(params.wethAddress),
          tokenOut: getAddress(params.usdtAddress),
          fee: params.fee,
          recipient: params.recipient ? getAddress(params.recipient) : account,
          deadline,
          amountIn: amountInWei,
          amountOutMinimum: BigInt(amountOutMinimumWei),
          sqrtPriceLimitX96: params.sqrtPriceLimitX96 ? BigInt(params.sqrtPriceLimitX96) : 0n
        }
      ]
    })

    const hash = await this.wallet.sendTransaction({
      chain: this.wallet.chain,
      account,
      to: router as `0x${string}`,
      value: 0n,
      data: calldata
    })
    await this.trackingHash(hash)

    return hash
  }

  // Utility function to calculate sqrtPriceLimitX96
  calculateSqrtPriceLimitX96(params: {
    price: number // price as decimal (e.g., 2000 means 1 token0 = 2000 token1)
    token0Decimals: number
    token1Decimals: number
    isToken0In?: boolean // true if selling token0 for token1
  }): string {
    const { price, token0Decimals, token1Decimals, isToken0In = true } = params

    // Adjust price for decimals difference
    const decimalAdjustment = Math.pow(10, token1Decimals - token0Decimals)
    let adjustedPrice = price * decimalAdjustment

    // If selling token1 for token0, invert the price
    if (!isToken0In) {
      adjustedPrice = 1 / adjustedPrice
    }

    // Calculate sqrt(price) * 2^96
    const sqrtPrice = Math.sqrt(adjustedPrice)
    const Q96 = Math.pow(2, 96)
    const sqrtPriceLimitX96 = BigInt(Math.floor(sqrtPrice * Q96))

    return sqrtPriceLimitX96.toString()
  }

  // Helper to get current pool price for reference
  getCurrentPoolPrice(param: {
    poolAddress: string
    sqrtPriceX96: bigint
    token0Decimals: number
    token1Decimals: number

  }): {
    price: number
    sqrtPriceX96: string

  } {
    const { sqrtPriceX96, token0Decimals, token1Decimals } = param

    // Convert sqrtPriceX96 to actual price
    const Q96 = Math.pow(2, 96)
    const sqrtPrice = Number(sqrtPriceX96) / Q96
    const price = sqrtPrice * sqrtPrice

    // Adjust for decimals
    const decimalAdjustment = Math.pow(10, token1Decimals - token0Decimals)
    const adjustedPrice = price / decimalAdjustment

    return {
      price: adjustedPrice,
      sqrtPriceX96: sqrtPriceX96.toString()

    }
  }



}
export default Pool