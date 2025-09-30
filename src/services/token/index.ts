import fetcher from '@/config/fetcher'
import { Token } from './type'

class TokenService {
  listTokens: Token[]
  constructor() {
    this.listTokens = []
  }

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
}

export default new TokenService()