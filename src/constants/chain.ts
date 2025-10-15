import { base, bsc } from 'viem/chains'

export const CHAIN_ID_SUPPORT = {
  56: 56,
  8453: 8453
} as Record<number, number>

export const CHAIN_TYPE_SUPPORT = {
  56: 'Bsc',
  8453: 'Base'
} as Record<number, string>


export const CHAIN_SUPPORT = {
  [bsc.id]: {
    ...bsc,
    rpcUrls: {
      default: { http: ['https://bsc-rpc.publicnode.com'] }
      // default: { http: ['https://nft.keyring.app/api/quickNodeRpc?chainType=bsc'] }

    }
  },
  [base.id]: {
    ...base,
    rpcUrls: {
      default: { http: ['https://nft.keyring.app/api/quickNodeRpc?chainType=base'] }
      // default: { http: ['https://nft.keyring.app/api/quickNodeRpc?chainType=base'] }
    }
  }
}