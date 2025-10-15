import Web3Service from '../web3'
import { Address, erc20Abi } from 'viem'
import { isNativeToken } from '@/utils/functions'
import { base } from 'viem/chains'
import { TOKEN } from '@/constants/token'
import { CHAIN_ID_SUPPORT } from '@/constants/chain'
import Pool from '../pool'

class TokenService extends Web3Service {


  async getPrice(id = '1027'): Promise<{
    price: number
    [key: string]: unknown
  }> {
    try {
      const chainId = base.id
      const tokenETH = TOKEN[CHAIN_ID_SUPPORT[chainId]].ETH!
      const tokenUSDT = TOKEN[CHAIN_ID_SUPPORT[chainId]].USDT!

      const pool = new Pool(chainId)

      const poolAddress = await pool.getPoolAddress({

        tokenA: tokenETH.address,
        tokenB: tokenUSDT.address,
        fee: 500 // or 3000, whatever fee tier exists
      })
      const poolState = await pool.getPoolState(poolAddress)
      const currentPoolPrice = pool.getCurrentPoolPrice({
        poolAddress,
        sqrtPriceX96: poolState.sqrtPriceX96,
        token0Decimals: poolState.token0Decimals,
        token1Decimals: poolState.token1Decimals

      })
      return { price: currentPoolPrice.price }
    } catch {
      return { price: 0 }
    }
  }

  async getBalance(tokenAddress: Address, walletAddress?: Address): Promise<bigint> {
    try {
      if (!walletAddress) {
        walletAddress = this.wallet?.account?.address as Address
      }

      if (isNativeToken(tokenAddress)) {
        const res = await this.client.getBalance({ address: walletAddress })
        return res
      } else {
        const res = await this.client.readContract({
          address: tokenAddress,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [walletAddress]
        })
        return res
      }
    } catch (error) {
      console.error('Get balance error:', error)
      return BigInt(0)
    }
  }
}

export default TokenService