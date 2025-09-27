import { Request, Response } from 'express'
import { createOrGetDefaultPlan, getCurrentEthPrice, computeNextDCA, executeRecommendedTrade } from '@/services/dcaStrategyService'
import DCAPlan from '@/models/DCAPlan'
import DCATrade from '@/models/DCATrade'

export const getPlan = async (_req: Request, res: Response): Promise<void> => {
  try {
    const plan = await createOrGetDefaultPlan()
    res.status(200).json({ success: true, data: plan })
  } catch (e: any) {
    res.status(500).json({ success: false, message: 'Failed to get plan', error: e.message })
  }
}

export const nextRecommendation = async (_req: Request, res: Response): Promise<void> => {
  try {
    const plan = await createOrGetDefaultPlan()
    const price = await getCurrentEthPrice()
    const recommendation = await computeNextDCA(plan, price)
    res.status(200).json({ success: true, data: recommendation })
  } catch (e: any) {
    res.status(500).json({ success: false, message: 'Failed to compute recommendation', error: e.message })
  }
}

export const executeStep = async (_req: Request, res: Response): Promise<void> => {
  try {
    const plan = await createOrGetDefaultPlan()
    const price = await getCurrentEthPrice()
    const recommendation = await computeNextDCA(plan, price)
    await executeRecommendedTrade(plan, recommendation)
    res.status(200).json({ success: true, message: 'Step executed', data: recommendation })
  } catch (e: any) {
    res.status(500).json({ success: false, message: 'Failed to execute step', error: e.message })
  }
}

export const listTrades = async (_req: Request, res: Response): Promise<void> => {
  try {
    const trades = await DCATrade.find().sort({ createdAt: -1 }).limit(100)
    res.status(200).json({ success: true, data: trades })
  } catch (e: any) {
    res.status(500).json({ success: false, message: 'Failed to list trades', error: e.message })
  }
}

export const resetPlan = async (_req: Request, res: Response): Promise<void> => {
  try {
    await DCAPlan.deleteMany({ tokenSymbol: 'ETH' })
    await DCATrade.deleteMany({})
    const plan = await createOrGetDefaultPlan()
    res.status(200).json({ success: true, message: 'Plan reset', data: plan })
  } catch (e: any) {
    res.status(500).json({ success: false, message: 'Failed to reset plan', error: e.message })
  }
}
