import { createPublicClient, getAddress, http, PublicClient, createWalletClient, WalletClient, Hex } from 'viem'
import { base, bsc } from 'viem/chains'
import { ERC20_ABI } from '@/abi/token'
import { DATA_UNISWAP } from '@/constants/pool'
import { CHAIN_ID_SUPPORT } from '@/constants/chain'

class Web3Service {
  client: PublicClient
  wallet?: WalletClient
  constructor(chainId: number = 56) {
    this.client = this.getClient(chainId)
    this.initWallet(chainId).catch(e => console.error('Init wallet error:', e))
  }

  private async initWallet(chainId: number) {
    const pk = process.env.DCA_PRIVATE_KEY
    if (!pk) return
    const accountModule = await import('viem/accounts')
    const account = accountModule.privateKeyToAccount(pk as Hex)
    const CHAIN_SUPPORT = { [bsc.id]: bsc, [base.id]: base }
    const chain = CHAIN_SUPPORT[chainId as keyof typeof CHAIN_SUPPORT]
    this.wallet = createWalletClient({
      chain,
      account,
      transport: http(process.env.BSC_RPC_URL || chain.rpcUrls.default.http[0])
    })
  }

  getClient(chainId: number): PublicClient {
    const CHAIN_SUPPORT = {
      [bsc.id]: bsc,
      [base.id]: base
    }
    const chain = CHAIN_SUPPORT[chainId as keyof typeof CHAIN_SUPPORT]

    const client = createPublicClient({
      chain: chain,
      transport: http(process.env.BSC_RPC_URL || chain.rpcUrls.default.http[0])
    })
    return client as unknown as PublicClient
  }


  getRouterAddress(chainId: number) {
    const mapping: Record<number, string> = {
      [bsc.id]: DATA_UNISWAP[CHAIN_ID_SUPPORT.Bsc].routerAddress,
      [base.id]: DATA_UNISWAP[CHAIN_ID_SUPPORT.Base].routerAddress
    }
    return getAddress(mapping[chainId])
  }

  async ensureAllowance(token: string, owner: string, spender: string, minAmount: bigint) {
    const allowance = await this.client.readContract({
      address: getAddress(token),
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [owner as `0x${string}`, spender as `0x${string}`]
    }) as bigint
    if (allowance < minAmount) {
      if (!this.wallet) throw new Error('Wallet not initialized for approvals')
      const account = (await this.wallet.getAddresses())[0]
      const hash = await this.wallet.writeContract({
        chain: this.wallet.chain,
        account,
        address: getAddress(token),
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [getAddress(spender), minAmount]
      })
      return { approvalTx: hash }
    }
    return { approvalTx: null }
  }


  // ---------- High-level helpers for token <-> stable swaps ----------
  private STABLES: Record<number, { USDT?: string; USDC?: string; BUSD?: string }> = {
    [bsc.id]: {
      USDT: process.env.USDT_BSC || '0x55d398326f99059fF775485246999027B3197955',
      BUSD: process.env.BUSD_BSC || '0xe9e7cea3dedca5984780bafc599bd69add087d56'
    },
    [base.id]: {
      USDC: process.env.USDC_BASE || '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
    }
  }

  async getDecimals(token: string): Promise<number> {
    const result = await this.client.readContract({
      address: getAddress(token),
      abi: ERC20_ABI,
      functionName: 'decimals'
    }) as number
    return result
  }

  toRaw(amountDecimal: string, decimals: number): bigint {
    const [whole, frac = ''] = amountDecimal.split('.')
    if (!/^\d+$/.test(whole) || (frac && !/^\d+$/.test(frac))) {
      throw new Error('Invalid decimal amount format')
    }
    const fracPadded = (frac + '0'.repeat(decimals)).slice(0, decimals)
    return BigInt(whole + fracPadded)
  }


}

export default Web3Service