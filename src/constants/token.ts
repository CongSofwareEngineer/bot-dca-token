import { arbitrum, base, bsc } from 'viem/chains'
import { CHAIN_ID_SUPPORT } from './chain'

export const TOKEN = {
  [CHAIN_ID_SUPPORT[bsc.id]]: {
    'ETH': {
      address: '0x2170ed0880ac9a755fd29b2688956bd959f933f8' as `0x${string}`,
      decimals: 18
    },
    'USDT': {
      address: '0x55d398326f99059ff775485246999027b3197955' as `0x${string}`,
      decimals: 18
    }
  },
  [CHAIN_ID_SUPPORT[base.id]]: {
    'ETH': {
      address: '0x4200000000000000000000000000000000000006' as `0x${string}`,
      decimals: 18
    },
    'USDC': {
      address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913' as `0x${string}`,
      decimals: 6
    },
    //USDC =  USDT
    'USDT': {
      address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913' as `0x${string}`,
      decimals: 6
    }
  },
  [CHAIN_ID_SUPPORT[arbitrum.id]]: {
    'ETH': {
      address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1' as `0x${string}`,
      decimals: 18
    },
    'USDC': {
      address: '0xaf88d065e77c8cc2239327c5edb3a432268e5831' as `0x${string}`,
      decimals: 6
    },
    //USDC =  USDT
    'USDT': {
      address: '0xaf88d065e77c8cc2239327c5edb3a432268e5831' as `0x${string}`,
      decimals: 6
    }
  }

}