
import { ethers } from 'ethers'

// --- CONFIG ---
// Base (Layer2) and Optimism RPCs (override with env if necessary)
const RPC_URL_BASE = process.env.RPC_URL_BASE || 'https://base-public.nodies.app'
const RPC_URL_OP = process.env.RPC_URL_OP || 'https://mainnet.optimism.io'

// Example pool addresses (replace if you want different pools)
const POOL_BASE = '0x951c97b306eee55C82adaB79a83Bb2397Cd1A8c9'
const POOL_OP = '0x4Efc6D91B5170b670A1BD5cfb8D4ae50283400eb'

// Token addresses (same on both chains for your tokens)
const JPYT = '0xc47da4cb96ce65a96844a01bfae509f9d5454534'
const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
const USDT_OP = '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58'

// Quoter V2 addresses per chain
const QUOTER_BASE_ADDR = '0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a'
const QUOTER_OP_ADDR = '0x61fFE014bA17989E743c5F6cB21bF9697530B21e'

// Fee tier (3000 = 0.3%)
const FEE_TIER = 3000

// --- ABIs ---
const IUniswapV3PoolABI = [
  'function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
  'function liquidity() view returns (uint128)',
  'function token0() view returns (address)',
  'function token1() view returns (address)'
]

const ERC20ABI = [
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)'
]

const QuoterV2ABI = [
  'function quoteExactInputSingle((address tokenIn,address tokenOut,uint256 amountIn,uint24 fee,uint160 sqrtPriceLimitX96)) external returns (uint256 amountOut, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate)'
]

// --- CONSTANTS ---
const Q96 = 2n ** 96n
const Q192 = 2n ** 192n

// --- HELPERS ---
function sqrtPriceX96ToPriceNum(sqrtPriceX96, dec0 = 6, dec1 = 6) {
  const s = BigInt(sqrtPriceX96)
  const pX192 = s * s
  const num = (pX192 * (10n ** BigInt(dec0))) / Q192
  const scaled = num / (10n ** BigInt(dec1))
  const remainder = num % (10n ** BigInt(dec1))
  const fractional = Number(remainder) / Number(10n ** BigInt(dec1))
  return Number(scaled) + fractional
}

function priceToSqrtPriceX96BigInt(price, dec0 = 6, dec1 = 6) {
  // NOTE: this is an approximation-focused helper (keeps using BigInt math)
  const scaled = BigInt(Math.floor(price * 1e18)) // scale to 1e18 to keep precision in integer math
  const scaleFactor = 10n ** BigInt(dec1 - dec0)
  const ratioX18 = scaled * scaleFactor // still big-int
  function sqrtBigInt(value) {
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
  // adjust back to X96 scale; we used 1e18 scaling so divide accordingly (approx.)
  return (sqrtRatioX18 * Q96) / (10n ** 9n)
}

function amount1ForSqrtPriceChange(L, sqrtA, sqrtB) {
  const delta = sqrtB > sqrtA ? sqrtB - sqrtA : sqrtA - sqrtB
  return (BigInt(L) * delta) / Q96
}

function amount0ForSqrtPriceChange(L, sqrtA, sqrtB) {
  const delta = sqrtA > sqrtB ? sqrtA - sqrtB : sqrtB - sqrtA
  return (BigInt(L) * Q96 * delta) / (BigInt(sqrtA) * BigInt(sqrtB))
}

function normalizeAddress(a) {
  if (!a) return ''
  return a.toLowerCase()
}

async function getPoolInfo(poolAddress, provider) {
  const pool = new ethers.Contract(poolAddress, IUniswapV3PoolABI, provider)
  const [slot0, liquidity, token0, token1] = await Promise.all([
    pool.slot0(),
    pool.liquidity(),
    pool.token0(),
    pool.token1()
  ])
  const sqrtPriceX96 = BigInt(slot0.sqrtPriceX96 ?? slot0[0])
  return { sqrtPriceX96, liquidity: BigInt(liquidity.toString()), token0, token1 }
}

async function getTokenMeta(tokenAddr, provider) {
  const t = new ethers.Contract(tokenAddr, ERC20ABI, provider)
  const [dec, sym] = await Promise.all([t.decimals(), t.symbol()])
  return { decimals: dec, symbol: sym }
}

async function getPoolMidPrice(poolAddress, provider, usdcAddr, jpytAddr) {
  const { sqrtPriceX96, token0, token1 } = await getPoolInfo(poolAddress, provider)
  const t0 = normalizeAddress(token0)
  const t1 = normalizeAddress(token1)
  const token0Meta = await getTokenMeta(token0, provider)
  const token1Meta = await getTokenMeta(token1, provider)
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
  throw new Error(`[getPoolMidPrice] Unexpected token pair: ${token0} / ${token1}`)
}

/**
 * findAmountToReachPrice
 * - If `availableAmount` is null or >= mathEstimate: tries binary search using quoter to find minimal amount.
 * - If `availableAmount` < mathEstimate: uses a gradual balancing strategy:
 *     split availableAmount into 'gradualChunks' cumulative steps, simulate cumulative swaps with quoter,
 *     and if target reached inside a chunk, binary-search inside that chunk for a minimal amount.
 *
 * Inputs:
 *   - tokenIn, tokenOut: addresses
 *   - decIn / decOut: decimals (for later formatting)
 *   - targetPrice: numerical target
 *   - direction: "up" (price increases) or "down"
 *   - availableAmount: BigInt (raw token units) or null
 *   - gradualChunks: integer (default 8)
 */
async function findAmountToReachPrice({
  poolAddress,
  provider,
  quoter,
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
}) {
  const pool = new ethers.Contract(poolAddress, IUniswapV3PoolABI, provider)
  const slot0 = await pool.slot0()
  const liquidity = await pool.liquidity()
  const sqrtPriceX96 = BigInt(slot0.sqrtPriceX96 ?? slot0[0])
  const L = BigInt(liquidity.toString())
  const token0 = await pool.token0()
  const token1 = await pool.token1()
  const meta0 = await getTokenMeta(token0, provider)
  const meta1 = await getTokenMeta(token1, provider)
  const sqrtTargetCorrect = priceToSqrtPriceX96BigInt(targetPrice, meta0.decimals, meta1.decimals)

  let mathEstimate
  if (direction === 'up') {
    mathEstimate = amount1ForSqrtPriceChange(L, sqrtPriceX96, sqrtTargetCorrect)
  } else {
    mathEstimate = amount0ForSqrtPriceChange(L, sqrtPriceX96, sqrtTargetCorrect)
  }
  if (mathEstimate <= 0n) throw new Error('mathEstimate <= 0; target might equal current or invalid')
  let quoterEstimate = mathEstimate
  try {
    const estTuple = {
      tokenIn,
      tokenOut,
      amountIn: mathEstimate,
      fee,
      sqrtPriceLimitX96: 0n
    }
    const estResult = await quoter.quoteExactInputSingle.staticCall(estTuple)
    const sqrtAfterEst = BigInt(estResult[1])
    const afterPriceEst = sqrtPriceX96ToPriceNum(sqrtAfterEst, meta0.decimals, meta1.decimals)
    console.log('-------')
    console.log('afterPriceEst', afterPriceEst)
    console.log('direction', direction)
    console.log('targetPrice', targetPrice)
    // If price didn’t reach target with mathEstimate, increase estimate until it does
    if (
      (direction === 'up' && afterPriceEst < targetPrice) ||
      (direction === 'down' && afterPriceEst > targetPrice)
    ) {
      console.log('call estimate eror')
      quoterEstimate = mathEstimate * 2n // fallback: just bump by 2x
    }
  } catch (e) {
    console.warn('[findAmountToReachPrice] quoterEstimate error, using mathEstimate:', e.message || e)
  }
  console.log('mathEstimate', mathEstimate)
  console.log('quoterEstimate', quoterEstimate)
  console.log('availableAmount', availableAmount)
  console.log('poolAddress', poolAddress)
  console.log('---------------')
  // If no availableAmount provided or sufficient, do normal binary search using quoter
  if (availableAmount === null || availableAmount >= quoterEstimate) {
    let low = 1n
    let high = mathEstimate * maxMultiplier
    let result = null
    let finalPrice = null
    let iter = 0
    while (low <= high && iter < maxIterations) {
      iter++
      const mid = (low + high) / 2n
      const tuple = {
        tokenIn: tokenIn,
        tokenOut: tokenOut,
        amountIn: mid,
        fee: fee,
        sqrtPriceLimitX96: 0n
      }
      try {
        // use callStatic through quoter (call the contract method)
        const resultTuple = await quoter.quoteExactInputSingle.staticCall(tuple)
        const sqrtAfter = BigInt(resultTuple[1])
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
        console.error('[findAmountToReachPrice] quoter.callStatic error:', e.message || e)
        break
      }
    }
    if (!result) {
      result = mathEstimate
      finalPrice = sqrtPriceX96ToPriceNum(sqrtTargetCorrect, meta0.decimals, meta1.decimals)
    }
    return { amountIn: result, finalPrice, usedGradual: false }
  }

  // --- Gradual balancing path (availableAmount < mathEstimate) ---
  // We'll split availableAmount into 'gradualChunks' cumulative steps and simulate
  // cumulative amounts with quoter. If the target is reached in one step,
  // binary search inside that chunk to find the minimal amount required.
  const chunks = BigInt(Math.max(1, Number(gradualChunks)))
  let chunk = availableAmount / chunks
  if (chunk === 0n) chunk = availableAmount // if fewer than chunks units available

  let cumulative = 0n
  let prevCumulative = 0n
  let finalPrice = null
  const reached = false

  for (let i = 0; i < Number(chunks); i++) {
    prevCumulative = cumulative
    cumulative += chunk
    if (cumulative > availableAmount) cumulative = availableAmount

    const tuple = {
      tokenIn: tokenIn,
      tokenOut: tokenOut,
      amountIn: cumulative,
      fee: fee,
      sqrtPriceLimitX96: 0n
    }
    try {
      const resultTuple = await quoter.quoteExactInputSingle.staticCall(tuple)
      const sqrtAfter = BigInt(resultTuple[1])
      const afterPrice = sqrtPriceX96ToPriceNum(sqrtAfter, meta0.decimals, meta1.decimals)
      if (direction === 'up') {
        if (afterPrice >= targetPrice) {
          // target reached between prevCumulative and cumulative -> binary search inside chunk
          let low = prevCumulative + 1n
          let high = cumulative
          let found = cumulative
          while (low <= high) {
            const mid = (low + high) / 2n
            const t2 = {
              tokenIn,
              tokenOut,
              amountIn: mid,
              fee,
              sqrtPriceLimitX96: 0n
            }
            const r2 = await quoter.quoteExactInputSingle.staticCall(t2)
            const sqrt2 = BigInt(r2[1])
            const price2 = sqrtPriceX96ToPriceNum(sqrt2, meta0.decimals, meta1.decimals)
            if (price2 >= targetPrice) {
              found = mid
              high = mid - 1n
            } else {
              low = mid + 1n
            }
          }
          finalPrice = sqrtPriceX96ToPriceNum(priceToSqrtPriceX96BigInt(targetPrice, meta0.decimals, meta1.decimals), meta0.decimals, meta1.decimals)
          return { amountIn: found, finalPrice, usedGradual: true }
        }
      } else {
        if (afterPrice <= targetPrice) {
          // target reached in this cumulative interval
          let low = prevCumulative + 1n
          let high = cumulative
          let found = cumulative
          while (low <= high) {
            const mid = (low + high) / 2n
            const t2 = {
              tokenIn,
              tokenOut,
              amountIn: mid,
              fee,
              sqrtPriceLimitX96: 0n
            }
            const r2 = await quoter.quoteExactInputSingle.staticCall(t2)
            const sqrt2 = BigInt(r2[1])
            const price2 = sqrtPriceX96ToPriceNum(sqrt2, meta0.decimals, meta1.decimals)
            if (price2 <= targetPrice) {
              found = mid
              high = mid - 1n
            } else {
              low = mid + 1n
            }
          }
          finalPrice = sqrtPriceX96ToPriceNum(priceToSqrtPriceX96BigInt(targetPrice, meta0.decimals, meta1.decimals), meta0.decimals, meta1.decimals)
          return { amountIn: found, finalPrice, usedGradual: true }
        }
      }
      // not reached yet
      if (cumulative === availableAmount) break
    } catch (e) {
      console.error('[findAmountToReachPrice] gradual quoter.callStatic error:', e.message || e)
      break
    }
  }

  // If we exit loop without reaching target, return max available used
  // simulate final price for availableAmount:
  try {
    const finalTuple = {
      tokenIn,
      tokenOut,
      amountIn: availableAmount,
      fee,
      sqrtPriceLimitX96: 0n
    }
    const rFinal = await quoter.quoteExactInputSingle.staticCall(finalTuple)
    const sqrtFinal = BigInt(rFinal[1])
    finalPrice = sqrtPriceX96ToPriceNum(sqrtFinal, meta0.decimals, meta1.decimals)
  } catch (e) {
    console.error('[findAmountToReachPrice] final sim error:', e.message || e)
    finalPrice = sqrtPriceX96ToPriceNum(sqrtTargetCorrect, meta0.decimals, meta1.decimals)
  }

  return { amountIn: availableAmount, finalPrice, usedGradual: true }
}

// --- PER-POOL CALC ---
async function calculatePoolMove({
  poolName,
  poolAddress,
  provider,
  quoter,
  usdcAddr,
  jpytAddr,
  targetPrice,
  availableAmount = null, // optional BigInt of available token for this chain
  gradualChunks = 8
}) {
  const metaUSDC = await getTokenMeta(usdcAddr, provider)
  const metaJPYT = await getTokenMeta(jpytAddr, provider)
  const currentPrice = await getPoolMidPrice(poolAddress, provider, usdcAddr, jpytAddr)
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
    provider,
    quoter,
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
async function main() {
  const providerBase = new ethers.JsonRpcProvider(RPC_URL_BASE)
  const providerOp = new ethers.JsonRpcProvider(RPC_URL_OP)
  const quoterBase = new ethers.Contract(QUOTER_BASE_ADDR, QuoterV2ABI, providerBase)
  const quoterOp = new ethers.Contract(QUOTER_OP_ADDR, QuoterV2ABI, providerOp)

  console.log('Fetching mid prices...')
  const isKeepUsedHightPrice = false
  const basePrice = await getPoolMidPrice(POOL_BASE, providerBase, USDC_BASE, JPYT)
  const opPrice = await getPoolMidPrice(POOL_OP, providerOp, USDT_OP, JPYT)
  const targetPrice = isKeepUsedHightPrice ? (basePrice > opPrice ? basePrice : opPrice) : ((basePrice + opPrice) / 2.0)
  console.log('Base =', basePrice, 'JPYT/USDC')
  console.log('Optimism =', opPrice, 'JPYT/USDT')
  console.log('Target =', targetPrice, 'JPYT/USD')

  // Optional: read available amounts from env variables (strings) and parse according to decimals
  // Example env names:
  // AVAILABLE_JPYT_BASE="1000"   (in human units)
  // AVAILABLE_USDT_OP="500"
  // If env variable not present, availableAmount will be null => full immediate mode
  let availableJPYTBase = null
  let availableUSDTOp = null
  //   let AVAILABLE_JPYT_BASE =  200000  ||  Number(process.env.AVAILABLE_JPYT_BASE || 0)
  const AVAILABLE_JPYT_BASE = '900000'
  //   let AVAILABLE_USDT_OP =  1000 || Number(process.env.AVAILABLE_USDT_OP || 0) 
  const AVAILABLE_USDT_OP = '28760'
  // let AVAILABLE_USDT_OP =  '2756'
  try {
    // Only parse if provided
    if (AVAILABLE_JPYT_BASE) {
      const metaJPYTBase = await getTokenMeta(JPYT, providerBase)
      availableJPYTBase = ethers.parseUnits(AVAILABLE_JPYT_BASE, metaJPYTBase.decimals)
    }
    if (AVAILABLE_USDT_OP) {
      const metaUSDTOp = await getTokenMeta(USDT_OP, providerOp)
      availableUSDTOp = ethers.parseUnits(AVAILABLE_USDT_OP, metaUSDTOp.decimals)
    }
  } catch (e) {
    console.warn('Warning parsing AVAILABLE_* env vars:', e.message || e)
  }

  const baseResult = await calculatePoolMove({
    poolName: 'Base',
    poolAddress: POOL_BASE,
    provider: providerBase,
    quoter: quoterBase,
    usdcAddr: USDC_BASE,
    jpytAddr: JPYT,
    targetPrice,
    availableAmount: availableJPYTBase, // for 'up' direction this will be the JPYT available on Base
    gradualChunks: process.env.GRADUAL_CHUNKS ? Number(process.env.GRADUAL_CHUNKS) : 10
  })
  const opResult = await calculatePoolMove({
    poolName: 'Optimism',
    poolAddress: POOL_OP,
    provider: providerOp,
    quoter: quoterOp,
    usdcAddr: USDT_OP,
    jpytAddr: JPYT,
    targetPrice,
    availableAmount: availableUSDTOp, // for 'down' direction this will be USDT available on Optimism
    gradualChunks: process.env.GRADUAL_CHUNKS ? Number(process.env.GRADUAL_CHUNKS) : 10
  })

  console.log('\n=== FINAL SUMMARY ===')
  for (const r of [baseResult, opResult]) {
    if (!r) continue
    console.log(`\n[${r.poolName}]`)
    console.log('Direction:', r.direction === 'up' ? `Swap JPYT → ${r.poolName === 'Optimism' ? 'USDT' : 'USDC'}` : `Swap ${r.poolName === 'Optimism' ? 'USDT' : 'USDC'} → JPYT`)
    console.log('Estimated amountIn:', ethers.formatUnits(r.amountIn, r.decIn), r.symbolIn)
    console.log(`Final price estimate (JPYT per ${r.poolName === 'Optimism' ? 'USDT' : 'USDC'}):`, r.finalPrice)
    console.log(`Strategy used: ${r.usedGradual ? 'Gradual balancing (insufficient single-swap amount)' : 'Single-swap plan'}`)
    console.log(`Action: Swap ~ ${ethers.formatUnits(r.amountIn, r.decIn)} ${r.symbolIn} on ${r.poolName} pool (fee ${FEE_TIER})`)
  }
}

main().catch((e) => {
  console.error('Fatal error:', e.stack || e)
  process.exit(1)
})