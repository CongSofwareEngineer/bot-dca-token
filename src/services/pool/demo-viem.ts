import { createPublicClient, http, getAddress, parseUnits, formatUnits, Address } from 'viem'
import { base, optimism } from 'viem/chains'

// --- CONFIG ---
const RPC_URL_BASE = process.env.RPC_URL_BASE || 'https://base-public.nodies.app'
const RPC_URL_OP = process.env.RPC_URL_OP || 'https://mainnet.optimism.io'

// Example pool addresses
const POOL_BASE = '0x951c97b306eee55C82adaB79a83Bb2397Cd1A8c9' as Address
const POOL_OP = '0x4Efc6D91B5170b670A1BD5cfb8D4ae50283400eb' as Address

// Token addresses
const JPYT = '0xc47da4cb96ce65a96844a01bfae509f9d5454534' as Address
const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address
const USDT_OP = '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58' as Address

// Quoter V2 addresses
const QUOTER_BASE_ADDR = '0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a' as Address
const QUOTER_OP_ADDR = '0x61fFE014bA17989E743c5F6cB21bF9697530B21e' as Address

// Fee tier
const FEE_TIER = 3000

// --- ABIs ---
const IUniswapV3PoolABI = [
  {
    inputs: [],
    name: 'slot0',
    outputs: [
      { name: 'sqrtPriceX96', type: 'uint160' },
      { name: 'tick', type: 'int24' },
      { name: 'observationIndex', type: 'uint16' },
      { name: 'observationCardinality', type: 'uint16' },
      { name: 'observationCardinalityNext', type: 'uint16' },
      { name: 'feeProtocol', type: 'uint8' },
      { name: 'unlocked', type: 'bool' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'liquidity',
    outputs: [{ name: '', type: 'uint128' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'token0',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'token1',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const

const ERC20ABI = [
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const

const QuoterV2ABI = [
  {
    inputs: [
      {
        components: [
          { name: 'tokenIn', type: 'address' },
          { name: 'tokenOut', type: 'address' },
          { name: 'amountIn', type: 'uint256' },
          { name: 'fee', type: 'uint24' },
          { name: 'sqrtPriceLimitX96', type: 'uint160' }
        ],
        name: 'params',
        type: 'tuple'
      }
    ],
    name: 'quoteExactInputSingle',
    outputs: [
      { name: 'amountOut', type: 'uint256' },
      { name: 'sqrtPriceX96After', type: 'uint160' },
      { name: 'initializedTicksCrossed', type: 'uint32' },
      { name: 'gasEstimate', type: 'uint256' }
    ],
    stateMutability: 'nonpayable',
    type: 'function'
  }
] as const

// --- CONSTANTS ---
const Q96 = 2n ** 96n
const Q192 = 2n ** 192n

// --- TYPES ---
interface PoolInfo {
  sqrtPriceX96: bigint
  liquidity: bigint
  token0: Address
  token1: Address
}

interface TokenMeta {
  decimals: number
  symbol: string
}

interface CalculateResult {
  poolName: string
  direction: 'up' | 'down'
  amountIn: bigint
  decIn: number
  symbolIn: string
  finalPrice: number
  usedGradual: boolean
}

interface QuoteParams {
  tokenIn: Address
  tokenOut: Address
  amountIn: bigint
  fee: number
  sqrtPriceLimitX96: bigint
}

// --- HELPERS ---
function sqrtPriceX96ToPriceNum(sqrtPriceX96: bigint, dec0: number = 6, dec1: number = 6): number {
  const s = BigInt(sqrtPriceX96)
  const pX192 = s * s
  const num = (pX192 * (10n ** BigInt(dec0))) / Q192
  const scaled = num / (10n ** BigInt(dec1))
  const remainder = num % (10n ** BigInt(dec1))
  const fractional = Number(remainder) / Number(10n ** BigInt(dec1))
  return Number(scaled) + fractional
}

function priceToSqrtPriceX96BigInt(price: number, dec0: number = 6, dec1: number = 6): bigint {
  const scaled = BigInt(Math.floor(price * 1e18))
  const scaleFactor = 10n ** BigInt(dec1 - dec0)
  const ratioX18 = scaled * scaleFactor

  function sqrtBigInt(value: bigint): bigint {
    if (value < 2n) return value
    let x0 = value / 2n
    let x1 = (x0 + value / x0) / 2n
    while (x1 < x0) {
      x0 = x1
      x1 = (x0 + value / x0) / 2n
    }
    return x0
  }

  const sqrtRatioX18 = sqrtBigInt(ratioX18)
  return (sqrtRatioX18 * Q96) / (10n ** 9n)
}

function amount1ForSqrtPriceChange(L: bigint, sqrtA: bigint, sqrtB: bigint): bigint {
  const delta = sqrtB > sqrtA ? sqrtB - sqrtA : sqrtA - sqrtB
  return (BigInt(L) * delta) / Q96
}

function amount0ForSqrtPriceChange(L: bigint, sqrtA: bigint, sqrtB: bigint): bigint {
  const delta = sqrtA > sqrtB ? sqrtA - sqrtB : sqrtB - sqrtA
  return (BigInt(L) * Q96 * delta) / (BigInt(sqrtA) * BigInt(sqrtB))
}

function normalizeAddress(a: string): string {
  if (!a) return ''
  return a.toLowerCase()
}

async function getPoolInfo(poolAddress: Address, client: any): Promise<PoolInfo> {
  const [slot0, liquidity, token0, token1] = await Promise.all([
    client.readContract({
      address: poolAddress,
      abi: IUniswapV3PoolABI,
      functionName: 'slot0'
    }),
    client.readContract({
      address: poolAddress,
      abi: IUniswapV3PoolABI,
      functionName: 'liquidity'
    }),
    client.readContract({
      address: poolAddress,
      abi: IUniswapV3PoolABI,
      functionName: 'token0'
    }),
    client.readContract({
      address: poolAddress,
      abi: IUniswapV3PoolABI,
      functionName: 'token1'
    })
  ])

  return {
    sqrtPriceX96: BigInt(slot0[0] as bigint),
    liquidity: BigInt(liquidity as bigint),
    token0: token0 as Address,
    token1: token1 as Address
  }
}

async function getTokenMeta(tokenAddr: Address, client: any): Promise<TokenMeta> {
  const [decimals, symbol] = await Promise.all([
    client.readContract({
      address: tokenAddr,
      abi: ERC20ABI,
      functionName: 'decimals'
    }),
    client.readContract({
      address: tokenAddr,
      abi: ERC20ABI,
      functionName: 'symbol'
    })
  ])

  return {
    decimals: decimals as number,
    symbol: symbol as string
  }
}

async function getPoolMidPrice(
  poolAddress: Address,
  client: any,
  usdcAddr: Address,
  jpytAddr: Address
): Promise<number> {
  const { sqrtPriceX96, token0, token1 } = await getPoolInfo(poolAddress, client)
  const t0 = normalizeAddress(token0)
  const t1 = normalizeAddress(token1)
  const token0Meta = await getTokenMeta(token0, client)
  const token1Meta = await getTokenMeta(token1, client)

  const price_token1_per_token0 = sqrtPriceX96ToPriceNum(
    sqrtPriceX96,
    token0Meta.decimals,
    token1Meta.decimals
  )

  const usdcNorm = normalizeAddress(usdcAddr)
  const jpytNorm = normalizeAddress(jpytAddr)

  if (t0 === usdcNorm && t1 === jpytNorm) {
    return price_token1_per_token0
  }
  if (t0 === jpytNorm && t1 === usdcNorm) {
    return 1 / price_token1_per_token0
  }
  throw new Error(`Unexpected token pair: ${token0} / ${token1}`)
}

async function findAmountToReachPrice({
  poolAddress,
  client,
  tokenIn,
  tokenOut,
  decIn,
  decOut,
  targetPrice,
  direction,
  fee = FEE_TIER,
  maxMultiplier = 4n,
  maxIterations = 96,
  availableAmount = null,
  gradualChunks = 8
}: {
  poolAddress: Address
  client: any
  tokenIn: Address
  tokenOut: Address
  decIn: number
  decOut: number
  targetPrice: number
  direction: 'up' | 'down'
  fee?: number
  maxMultiplier?: bigint
  maxIterations?: number
  availableAmount?: bigint | null
  gradualChunks?: number
}): Promise<{ amountIn: bigint; finalPrice: number; usedGradual: boolean }> {
  const { sqrtPriceX96, liquidity, token0, token1 } = await getPoolInfo(poolAddress, client)
  const L = BigInt(liquidity)
  const meta0 = await getTokenMeta(token0, client)
  const meta1 = await getTokenMeta(token1, client)
  const sqrtTargetCorrect = priceToSqrtPriceX96BigInt(targetPrice, meta0.decimals, meta1.decimals)

  let mathEstimate: bigint
  if (direction === 'up') {
    mathEstimate = amount1ForSqrtPriceChange(L, sqrtPriceX96, sqrtTargetCorrect)
  } else {
    mathEstimate = amount0ForSqrtPriceChange(L, sqrtPriceX96, sqrtTargetCorrect)
  }

  if (mathEstimate <= 0n) {
    throw new Error('mathEstimate <= 0; target might equal current or invalid')
  }

  let quoterEstimate = mathEstimate

  try {
    const estResult = await client.readContract({
      address: direction === 'up' ? QUOTER_BASE_ADDR : QUOTER_OP_ADDR,
      abi: QuoterV2ABI,
      functionName: 'quoteExactInputSingle',
      args: [{
        tokenIn,
        tokenOut,
        amountIn: mathEstimate,
        fee,
        sqrtPriceLimitX96: 0n
      }]
    })

    const sqrtAfterEst = BigInt(estResult[1] as bigint)
    const afterPriceEst = sqrtPriceX96ToPriceNum(sqrtAfterEst, meta0.decimals, meta1.decimals)

    if (
      (direction === 'up' && afterPriceEst < targetPrice) ||
      (direction === 'down' && afterPriceEst > targetPrice)
    ) {
      quoterEstimate = mathEstimate * 2n
    }
  } catch (e) {
    console.warn('quoterEstimate error, using mathEstimate:', e)
  }

  // If no availableAmount provided or sufficient, do normal binary search
  if (availableAmount === null || availableAmount >= quoterEstimate) {
    let low = 1n
    let high = mathEstimate * maxMultiplier
    let result: bigint | null = null
    let finalPrice: number | null = null
    let iter = 0

    while (low <= high && iter < maxIterations) {
      iter++
      const mid = (low + high) / 2n

      try {
        const resultTuple = await client.readContract({
          address: direction === 'up' ? QUOTER_BASE_ADDR : QUOTER_OP_ADDR,
          abi: QuoterV2ABI,
          functionName: 'quoteExactInputSingle',
          args: [{
            tokenIn,
            tokenOut,
            amountIn: mid,
            fee,
            sqrtPriceLimitX96: 0n
          }]
        })

        const sqrtAfter = BigInt(resultTuple[1] as bigint)
        const afterPrice = sqrtPriceX96ToPriceNum(sqrtAfter, meta0.decimals, meta1.decimals)

        if (direction === 'up') {
          if (afterPrice >= targetPrice) {
            result = mid
            finalPrice = afterPrice
            high = mid - 1n
          } else {
            low = mid + 1n
          }
        } else {
          if (afterPrice <= targetPrice) {
            result = mid
            finalPrice = afterPrice
            high = mid - 1n
          } else {
            low = mid + 1n
          }
        }
      } catch (e) {
        console.error('quoter error:', e)
        break
      }
    }

    if (!result) {
      result = mathEstimate
      finalPrice = sqrtPriceX96ToPriceNum(sqrtTargetCorrect, meta0.decimals, meta1.decimals)
    }

    return { amountIn: result, finalPrice: finalPrice!, usedGradual: false }
  }

  // Gradual balancing path
  const chunks = BigInt(Math.max(1, Number(gradualChunks)))
  let chunk = availableAmount / chunks
  if (chunk === 0n) chunk = availableAmount

  let cumulative = 0n
  let prevCumulative = 0n
  let finalPrice: number | null = null

  for (let i = 0; i < Number(chunks); i++) {
    prevCumulative = cumulative
    cumulative += chunk
    if (cumulative > availableAmount) cumulative = availableAmount

    try {
      const resultTuple = await client.readContract({
        address: direction === 'up' ? QUOTER_BASE_ADDR : QUOTER_OP_ADDR,
        abi: QuoterV2ABI,
        functionName: 'quoteExactInputSingle',
        args: [{
          tokenIn,
          tokenOut,
          amountIn: cumulative,
          fee,
          sqrtPriceLimitX96: 0n
        }]
      })

      const sqrtAfter = BigInt(resultTuple[1] as bigint)
      const afterPrice = sqrtPriceX96ToPriceNum(sqrtAfter, meta0.decimals, meta1.decimals)

      if (direction === 'up') {
        if (afterPrice >= targetPrice) {
          // Binary search within chunk
          let low = prevCumulative + 1n
          let high = cumulative
          let found = cumulative

          while (low <= high) {
            const mid = (low + high) / 2n
            const r2 = await client.readContract({
              address: direction === 'up' ? QUOTER_BASE_ADDR : QUOTER_OP_ADDR,
              abi: QuoterV2ABI,
              functionName: 'quoteExactInputSingle',
              args: [{
                tokenIn,
                tokenOut,
                amountIn: mid,
                fee,
                sqrtPriceLimitX96: 0n
              }]
            })

            const sqrt2 = BigInt(r2[1] as bigint)
            const price2 = sqrtPriceX96ToPriceNum(sqrt2, meta0.decimals, meta1.decimals)

            if (price2 >= targetPrice) {
              found = mid
              high = mid - 1n
            } else {
              low = mid + 1n
            }
          }

          finalPrice = sqrtPriceX96ToPriceNum(
            priceToSqrtPriceX96BigInt(targetPrice, meta0.decimals, meta1.decimals),
            meta0.decimals,
            meta1.decimals
          )
          return { amountIn: found, finalPrice, usedGradual: true }
        }
      } else {
        if (afterPrice <= targetPrice) {
          // Similar binary search for down direction
          let low = prevCumulative + 1n
          let high = cumulative
          let found = cumulative

          while (low <= high) {
            const mid = (low + high) / 2n
            const r2 = await client.readContract({
              address: direction === 'up' ? QUOTER_BASE_ADDR : QUOTER_OP_ADDR,
              abi: QuoterV2ABI,
              functionName: 'quoteExactInputSingle',
              args: [{
                tokenIn,
                tokenOut,
                amountIn: mid,
                fee,
                sqrtPriceLimitX96: 0n
              }]
            })

            const sqrt2 = BigInt(r2[1] as bigint)
            const price2 = sqrtPriceX96ToPriceNum(sqrt2, meta0.decimals, meta1.decimals)

            if (price2 <= targetPrice) {
              found = mid
              high = mid - 1n
            } else {
              low = mid + 1n
            }
          }

          finalPrice = sqrtPriceX96ToPriceNum(
            priceToSqrtPriceX96BigInt(targetPrice, meta0.decimals, meta1.decimals),
            meta0.decimals,
            meta1.decimals
          )
          return { amountIn: found, finalPrice, usedGradual: true }
        }
      }

      if (cumulative === availableAmount) break
    } catch (e) {
      console.error('gradual quoter error:', e)
      break
    }
  }

  // Return max available if target not reached
  try {
    const rFinal = await client.readContract({
      address: direction === 'up' ? QUOTER_BASE_ADDR : QUOTER_OP_ADDR,
      abi: QuoterV2ABI,
      functionName: 'quoteExactInputSingle',
      args: [{
        tokenIn,
        tokenOut,
        amountIn: availableAmount,
        fee,
        sqrtPriceLimitX96: 0n
      }]
    })

    const sqrtFinal = BigInt(rFinal[1] as bigint)
    finalPrice = sqrtPriceX96ToPriceNum(sqrtFinal, meta0.decimals, meta1.decimals)
  } catch (e) {
    console.error('final sim error:', e)
    finalPrice = sqrtPriceX96ToPriceNum(sqrtTargetCorrect, meta0.decimals, meta1.decimals)
  }

  return { amountIn: availableAmount, finalPrice: finalPrice!, usedGradual: true }
}

async function calculatePoolMove({
  poolName,
  poolAddress,
  client,
  quoterAddr,
  usdcAddr,
  jpytAddr,
  targetPrice,
  availableAmount = null,
  gradualChunks = 8
}: {
  poolName: string
  poolAddress: Address
  client: any
  quoterAddr: Address
  usdcAddr: Address
  jpytAddr: Address
  targetPrice: number
  availableAmount?: bigint | null
  gradualChunks?: number
}): Promise<CalculateResult | null> {
  const metaUSDC = await getTokenMeta(usdcAddr, client)
  const metaJPYT = await getTokenMeta(jpytAddr, client)
  const currentPrice = await getPoolMidPrice(poolAddress, client, usdcAddr, jpytAddr)

  const direction = targetPrice > currentPrice ? 'up' : (targetPrice < currentPrice ? 'down' : 'none')

  if (direction === 'none') {
    console.log(`${poolName} pool already at target price.`)
    return null
  }

  const tokenIn = direction === 'up' ? jpytAddr : usdcAddr
  const tokenOut = direction === 'up' ? usdcAddr : jpytAddr
  const decIn = direction === 'up' ? metaJPYT.decimals : metaUSDC.decimals
  const decOut = direction === 'up' ? metaUSDC.decimals : metaJPYT.decimals

  const { amountIn, finalPrice, usedGradual } = await findAmountToReachPrice({
    poolAddress,
    client,
    tokenIn,
    tokenOut,
    decIn,
    decOut,
    targetPrice,
    direction,
    availableAmount,
    gradualChunks
  })

  return {
    poolName,
    direction,
    amountIn,
    decIn,
    symbolIn: direction === 'up' ? metaJPYT.symbol : metaUSDC.symbol,
    finalPrice,
    usedGradual
  }
}

// --- MAIN ---
async function main(): Promise<void> {
  // Create viem clients
  const clientBase = createPublicClient({
    chain: base,
    transport: http(RPC_URL_BASE)
  })

  const clientOp = createPublicClient({
    chain: optimism,
    transport: http(RPC_URL_OP)
  })

  console.log('Fetching mid prices...')
  const isKeepUsedHightPrice = false
  const basePrice = await getPoolMidPrice(POOL_BASE, clientBase, USDC_BASE, JPYT)
  const opPrice = await getPoolMidPrice(POOL_OP, clientOp, USDT_OP, JPYT)
  const targetPrice = isKeepUsedHightPrice
    ? (basePrice > opPrice ? basePrice : opPrice)
    : ((basePrice + opPrice) / 2.0)

  console.log('Base =', basePrice, 'JPYT/USDC')
  console.log('Optimism =', opPrice, 'JPYT/USDT')
  console.log('Target =', targetPrice, 'JPYT/USD')

  // Parse available amounts
  let availableJPYTBase: bigint | null = null
  let availableUSDTOp: bigint | null = null
  const AVAILABLE_JPYT_BASE = '900000'
  const AVAILABLE_USDT_OP = '28760'

  try {
    if (AVAILABLE_JPYT_BASE) {
      const metaJPYTBase = await getTokenMeta(JPYT, clientBase)
      availableJPYTBase = parseUnits(AVAILABLE_JPYT_BASE, metaJPYTBase.decimals)
    }
    if (AVAILABLE_USDT_OP) {
      const metaUSDTOp = await getTokenMeta(USDT_OP, clientOp)
      availableUSDTOp = parseUnits(AVAILABLE_USDT_OP, metaUSDTOp.decimals)
    }
  } catch (e) {
    console.warn('Warning parsing AVAILABLE_* amounts:', e)
  }

  const baseResult = await calculatePoolMove({
    poolName: 'Base',
    poolAddress: POOL_BASE,
    client: clientBase,
    quoterAddr: QUOTER_BASE_ADDR,
    usdcAddr: USDC_BASE,
    jpytAddr: JPYT,
    targetPrice,
    availableAmount: availableJPYTBase,
    gradualChunks: 10
  })

  const opResult = await calculatePoolMove({
    poolName: 'Optimism',
    poolAddress: POOL_OP,
    client: clientOp,
    quoterAddr: QUOTER_OP_ADDR,
    usdcAddr: USDT_OP,
    jpytAddr: JPYT,
    targetPrice,
    availableAmount: availableUSDTOp,
    gradualChunks: 10
  })

  console.log('\n=== FINAL SUMMARY ===')
  for (const r of [baseResult, opResult]) {
    if (!r) continue
    console.log(`\n[${r.poolName}]`)
    console.log('Direction:', r.direction === 'up'
      ? `Swap JPYT → ${r.poolName === 'Optimism' ? 'USDT' : 'USDC'}`
      : `Swap ${r.poolName === 'Optimism' ? 'USDT' : 'USDC'} → JPYT`)
    console.log('Estimated amountIn:', formatUnits(r.amountIn, r.decIn), r.symbolIn)
    console.log(`Final price estimate (JPYT per ${r.poolName === 'Optimism' ? 'USDT' : 'USDC'}):`, r.finalPrice)
    console.log(`Strategy used: ${r.usedGradual ? 'Gradual balancing (insufficient single-swap amount)' : 'Single-swap plan'}`)
    console.log(`Action: Swap ~ ${formatUnits(r.amountIn, r.decIn)} ${r.symbolIn} on ${r.poolName} pool (fee ${FEE_TIER})`)
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch((e) => {
    console.error('Fatal error:', e.stack || e)
    process.exit(1)
  })
}

export {
  calculatePoolMove,
  getPoolMidPrice,
  findAmountToReachPrice,
  getPoolInfo,
  getTokenMeta,
  sqrtPriceX96ToPriceNum,
  priceToSqrtPriceX96BigInt
}