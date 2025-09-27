import BigNumber from 'bignumber.js'
import DCAPlan, { IDCAPlan } from '@/models/DCAPlan'
import DCATrade from '@/models/DCATrade'

interface AllocationResult {
  price: number;
  weight: number; // normalized weight 0..1
  capitalSlice: number; // USD planned at this price
}

export interface NextDCARecommendation {
  planId: string;
  currentPrice: number;
  suggestedCapital: number; // USD to deploy now
  suggestedAmount: number; // ETH to buy now
  remainingDeployableCapital: number; // USD left after suggested trade
  projectedAveragePrice: number; // avg price after trade
  progress: {
    executedCapital: number;
    totalAvailableCapital: number;
    executedPercent: number;
  };
  allocationBandInfo: AllocationResult[];
  status: 'continue' | 'complete';
}

// Weight function: higher weight when price is nearer minPrice
// Use quadratic to strongly favor lower prices
function weightFunction(price: number, min: number, max: number): number {
  const span = max - min
  if (span <= 0) return 1
  const distanceFromTop = max - price // higher near bottom
  const ratio = distanceFromTop / span // 0 at top, 1 at bottom
  return Math.pow(Math.max(0, Math.min(1, ratio)), 2) // quadratic
}

// Compute total available capital including monthly top-ups
function computeTotalAvailable(plan: IDCAPlan, now = new Date()): number {
  const monthsElapsed = Math.max(0, Math.floor((now.getTime() - plan.startDate.getTime()) / (30 * 24 * 3600 * 1000)))
  return plan.initialCapital + monthsElapsed * plan.monthlyTopUp
}

export async function createOrGetDefaultPlan(): Promise<IDCAPlan> {
  let plan = await DCAPlan.findOne({ status: 'active', tokenSymbol: 'ETH' })
  if (!plan) {
    plan = await DCAPlan.create({
      tokenSymbol: 'ETH',
      minPrice: 1000,
      maxPrice: 2000,
      targetAveragePrice: 1500,
      initialCapital: 1000,
      monthlyTopUp: 200,
      startDate: new Date(),
      executedCapital: 0,
      executedAmount: 0,
      lastCapitalSnapshot: 1000
    })
  }
  return plan
}

export async function getCurrentEthPrice(): Promise<number> {
  // Re-use token price fetcher (requires WETH address or use placeholder) – for now use CoinGecko direct ETH
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd')
    const data = (await response.json()) as any
    return data.ethereum.usd
  } catch (e) {
    throw new Error('Failed to fetch ETH price')
  }
}

export async function computeNextDCA(plan: IDCAPlan, currentPrice: number): Promise<NextDCARecommendation> {
  const totalAvailable = computeTotalAvailable(plan)
  const remainingCapital = totalAvailable - plan.executedCapital

  // If no remaining capital -> mark done
  if (remainingCapital <= 0) {
    return {
      planId: plan._id.toString(),
      currentPrice,
      suggestedCapital: 0,
      suggestedAmount: 0,
      remainingDeployableCapital: 0,
      projectedAveragePrice: plan.executedAmount === 0 ? 0 : plan.executedCapital / plan.executedAmount,
      allocationBandInfo: [],
      progress: {
        executedCapital: plan.executedCapital,
        totalAvailableCapital: totalAvailable,
        executedPercent: 100
      },
      status: 'complete'
    }
  }

  // Build dynamic allocation bands (e.g., 10 slices in range)
  const slices = 10
  const step = (plan.maxPrice - plan.minPrice) / (slices - 1)
  const rawAllocations: AllocationResult[] = []
  for (let i = 0; i < slices; i++) {
    const price = plan.maxPrice - step * i // descending
    const weight = weightFunction(price, plan.minPrice, plan.maxPrice)
    rawAllocations.push({ price, weight, capitalSlice: 0 })
  }
  const weightSum = rawAllocations.reduce((a, b) => a + b.weight, 0) || 1
  rawAllocations.forEach(r => {
    r.capitalSlice = (r.weight / weightSum) * totalAvailable
  })

  // Determine which band current price sits in and suggested capital proportion of its slice leftover
  // Strategy: deploy up to 25% of slice for that band per invocation
  const currentBand = rawAllocations.reduce((prev, cur) => Math.abs(cur.price - currentPrice) < Math.abs(prev.price - currentPrice) ? cur : prev)
  const bandIndex = rawAllocations.indexOf(currentBand)

  // Compute how much of band slice already effectively used vs plan.executedCapital distribution proportionally
  // Approximation: assume earlier (higher) bands consumed first.
  const cumulativePrevious = rawAllocations.slice(0, bandIndex).reduce((a, b) => a + b.capitalSlice, 0)
  const capitalAllocatedToBand = Math.min(Math.max(plan.executedCapital - cumulativePrevious, 0), currentBand.capitalSlice)
  const bandRemaining = currentBand.capitalSlice - capitalAllocatedToBand

  const suggestedCapitalRaw = Math.min(bandRemaining * 0.25, remainingCapital) // deploy 25% of remaining in this band
  const minTicket = Math.min(remainingCapital, Math.max(10, totalAvailable * 0.01)) // at least $10 or 1% total
  const suggestedCapital = Number(new BigNumber(suggestedCapitalRaw).decimalPlaces(2, BigNumber.ROUND_DOWN).toString()) || 0

  if (suggestedCapital <= 0 || suggestedCapital < minTicket) {
    return {
      planId: plan._id.toString(),
      currentPrice,
      suggestedCapital: 0,
      suggestedAmount: 0,
      remainingDeployableCapital: remainingCapital,
      projectedAveragePrice: plan.executedAmount === 0 ? 0 : plan.executedCapital / plan.executedAmount,
      allocationBandInfo: rawAllocations,
      progress: {
        executedCapital: plan.executedCapital,
        totalAvailableCapital: totalAvailable,
        executedPercent: (plan.executedCapital / totalAvailable) * 100
      },
      status: remainingCapital <= 0 ? 'complete' : 'continue'
    }
  }

  const suggestedAmount = suggestedCapital / currentPrice
  const newExecutedCapital = plan.executedCapital + suggestedCapital
  const newExecutedAmount = plan.executedAmount + suggestedAmount
  const projectedAveragePrice = newExecutedCapital / newExecutedAmount

  // If projected avg would exceed targetAveragePrice when price near upper bound, we may reduce amount
  if (projectedAveragePrice > plan.targetAveragePrice && currentPrice > plan.targetAveragePrice) {
    // Scale down to keep projected average near target
    const targetCapitalForAvg = plan.targetAveragePrice * newExecutedAmount
    if (targetCapitalForAvg < newExecutedCapital) {
      const overShoot = newExecutedCapital - targetCapitalForAvg
      // reduce suggestedCapital by overshoot
      const adjustedCapital = suggestedCapital - overShoot
      if (adjustedCapital > 0) {
        const adjAmount = adjustedCapital / currentPrice
        const adjExecCapital = plan.executedCapital + adjustedCapital
        const adjExecAmount = plan.executedAmount + adjAmount
        return {
          planId: plan._id.toString(),
          currentPrice,
          suggestedCapital: Number(new BigNumber(adjustedCapital).decimalPlaces(2).toString()),
          suggestedAmount: Number(new BigNumber(adjAmount).decimalPlaces(8).toString()),
          remainingDeployableCapital: totalAvailable - adjExecCapital,
          projectedAveragePrice: adjExecCapital / adjExecAmount,
          allocationBandInfo: rawAllocations,
          progress: {
            executedCapital: plan.executedCapital,
            totalAvailableCapital: totalAvailable,
            executedPercent: (plan.executedCapital / totalAvailable) * 100
          },
          status: 'continue'
        }
      }
    }
  }

  return {
    planId: plan._id.toString(),
    currentPrice,
    suggestedCapital: Number(new BigNumber(suggestedCapital).decimalPlaces(2).toString()),
    suggestedAmount: Number(new BigNumber(suggestedAmount).decimalPlaces(8).toString()),
    remainingDeployableCapital: totalAvailable - newExecutedCapital,
    projectedAveragePrice: Number(new BigNumber(projectedAveragePrice).decimalPlaces(2).toString()),
    allocationBandInfo: rawAllocations,
    progress: {
      executedCapital: plan.executedCapital,
      totalAvailableCapital: totalAvailable,
      executedPercent: (plan.executedCapital / totalAvailable) * 100
    },
    status: 'continue'
  }
}

export async function executeRecommendedTrade(plan: IDCAPlan, recommendation: NextDCARecommendation): Promise<void> {
  if (recommendation.suggestedCapital <= 0) return
  const amount = recommendation.suggestedAmount
  // TODO: integrate real swap here via DEX. Currently simulate only.
  await DCATrade.create({
    planId: plan._id,
    price: recommendation.currentPrice,
    capitalUsed: recommendation.suggestedCapital,
    amount,
    remainingCapitalAfter: recommendation.remainingDeployableCapital,
    projectedAverage: recommendation.projectedAveragePrice,
    type: 'executed'
  })
  plan.executedCapital += recommendation.suggestedCapital
  plan.executedAmount += amount
  // Mark completed if average achieved and near fully deployed
  const totalAvailable = computeTotalAvailable(plan)
  if (plan.executedCapital >= totalAvailable || (plan.executedAmount > 0 && (plan.executedCapital / plan.executedAmount) <= plan.targetAveragePrice)) {
    plan.status = 'completed'
  }
  await plan.save()
}
