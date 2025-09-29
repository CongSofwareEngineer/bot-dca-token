export interface PoolState {
  sqrtPriceX96: bigint
  tick: number
  liquidity: bigint
  token0: string
  token1: string
  token0Decimals: number
  token1Decimals: number
  token0Symbol: string
  token1Symbol: string
}