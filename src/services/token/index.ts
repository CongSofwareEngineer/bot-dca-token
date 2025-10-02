import fetcher from '@/config/fetcher'
import { Token } from './type'
import Web3Service from '../web3'
import { Address, erc20Abi } from 'viem'
import { isNativeToken } from '@/utils/functions'

class TokenService extends Web3Service {


  async getPrice(id = '1027'): Promise<{
    price: number
    [key: string]: unknown
  }> {
    try {
      //1027 = ETH
      const res = await fetcher({
        url: `https://www.binance.com/bapi/composite/v1/public/promo/cmc/cryptocurrency/quotes/latest?id=${id}`
      })
      return res?.data?.body?.data[id]?.quote?.USD
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