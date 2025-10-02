import { createPublicClient, getAddress, http, PublicClient, createWalletClient, WalletClient, Hex, Hash, TransactionReceipt, GetTransactionReceiptReturnType, Chain, Address } from 'viem'
import { base, bsc } from 'viem/chains'
import { ERC20_ABI } from '@/abi/token'
import { DATA_UNISWAP } from '@/constants/pool'
import { CHAIN_ID_SUPPORT } from '@/constants/chain'

class Web3Service {
  client: PublicClient
  wallet?: WalletClient
  chainId: number
  constructor(chainId: number = bsc.id) {
    this.chainId = chainId
    this.client = this.getClient(chainId)
    this.initWallet(chainId).catch(e => console.error('Init wallet error:', e))
  }

  private async initWallet(chainId: number = bsc.id): Promise<void> {
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
      [bsc.id]: {
        ...bsc,
        rpcUrls: {
          default: { http: ['https://bsc-rpc.publicnode.com'] }
          // default: { http: ['https://nft.keyring.app/api/quickNodeRpc?chainType=bsc'] }

        }
      },
      [base.id]: base
    }
    const chain = CHAIN_SUPPORT[chainId as keyof typeof CHAIN_SUPPORT]

    const client = createPublicClient({
      chain: chain,
      transport: http(chain.rpcUrls.default.http[0])
    })
    return client as unknown as PublicClient
  }


  getRouterAddress(): Address {
    const mapping: Record<number, Address> = {
      [bsc.id]: DATA_UNISWAP[CHAIN_ID_SUPPORT[56]].routerAddress,
      [base.id]: DATA_UNISWAP[CHAIN_ID_SUPPORT[8453]].routerAddress
    }
    return getAddress(mapping[this.chainId])
  }

  async trackingHash(txHash: Hash, timeout = 300000): Promise<void> {
    const client = this.client

    await client.waitForTransactionReceipt({
      hash: txHash,
      timeout,
      retryCount: 1000,
      confirmations: 2
    })

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
      await this.trackingHash(hash)
      return { approvalTx: hash }
    }
    return { approvalTx: null }
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