import { CHAIN_ID_SUPPORT } from './chain'

export const TOKEN = {
  [CHAIN_ID_SUPPORT[56]]: {
    'ETH': {
      address: '0x2170ed0880ac9a755fd29b2688956bd959f933f8' as `0x${string}`,
      decimals: 18
    },
    'USDT': {
      address: '0x55d398326f99059ff775485246999027b3197955' as `0x${string}`,
      decimals: 18
    }
  },
  [CHAIN_ID_SUPPORT[8453]]: {
    'USD': {
      address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913' as `0x${string}`,
      decimals: 6
    }
  }

}