import { CHAIN_ID_SUPPORT } from '@/constants/chain'

export const getChainTypeFromId = (chainId: number) => {
  switch (chainId) {
    case 1:
      return CHAIN_ID_SUPPORT
    case 56:
      return 'Binance Smart Chain'
    case 137:
      return 'Polygon'
    default:
      return 'Unknown'
  }
}
