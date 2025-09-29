import { createPublicClient, getAddress, http, PublicClient, createWalletClient, WalletClient, encodeFunctionData, Hex } from 'viem'
import { base, bsc } from 'viem/chains'
import { PoolState } from './type'
import { V3_POOL_ABI } from '@/constants/pool'
import { ERC20_METADATA_ABI } from '@/constants/token'

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

  async getPoolState(poolAddress: string): Promise<PoolState> {
    const address = getAddress(poolAddress)
    const [slot0, token0, token1, liquidity] = await Promise.all([
      this.client.readContract({
        address,
        abi: V3_POOL_ABI,
        functionName: 'slot0'
      }) as Promise<[
        bigint, // sqrtPriceX96
        bigint | number, // tick (int24)
        number,
        number,
        number,
        number,
        boolean
      ]>,
      this.client.readContract({ address, abi: V3_POOL_ABI, functionName: 'token0' }) as Promise<`0x${string}`>,
      this.client.readContract({ address, abi: V3_POOL_ABI, functionName: 'token1' }) as Promise<`0x${string}`>,
      this.client.readContract({ address, abi: V3_POOL_ABI, functionName: 'liquidity' }) as Promise<bigint>
    ])

    const [
      token0Decimals, token1Decimals, token0Symbol, token1Symbol
    ] = await Promise.all([
      this.client.readContract({ address: token0, abi: ERC20_METADATA_ABI, functionName: 'decimals' }) as Promise<number>,
      this.client.readContract({ address: token1, abi: ERC20_METADATA_ABI, functionName: 'decimals' }) as Promise<number>,
      this.client.readContract({ address: token0, abi: ERC20_METADATA_ABI, functionName: 'symbol' }) as Promise<string>,
      this.client.readContract({ address: token1, abi: ERC20_METADATA_ABI, functionName: 'symbol' }) as Promise<string>
    ])



    return {
      sqrtPriceX96: slot0[0] as bigint,
      tick: Number(slot0[1]),
      liquidity,
      token0,
      token1,
      token0Decimals,
      token1Decimals,
      token0Symbol,
      token1Symbol
    }
  }

  // --- Swap Section ---
  // Minimal ERC20 for allowance & approve
  private ERC20_ABI = [
    { name: 'approve', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ name: '', type: 'bool' }] },
    { name: 'allowance', type: 'function', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
    { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
    { name: 'decimals', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'uint8' }] }
  ] as const

  // PancakeSwap / Uniswap V3 Router exactInputSingle & exactOutputSingle signatures
  private V3_SWAP_ROUTER_ABI = [
    {
      name: 'exactInputSingle',
      type: 'function',
      stateMutability: 'payable',
      inputs: [
        {
          components: [
            { name: 'tokenIn', type: 'address' },
            { name: 'tokenOut', type: 'address' },
            { name: 'fee', type: 'uint24' },
            { name: 'recipient', type: 'address' },
            { name: 'deadline', type: 'uint256' },
            { name: 'amountIn', type: 'uint256' },
            { name: 'amountOutMinimum', type: 'uint256' },
            { name: 'sqrtPriceLimitX96', type: 'uint160' }
          ],
          internalType: 'struct ISwapRouter.ExactInputSingleParams',
          name: 'params',
          type: 'tuple'
        }
      ],
      outputs: [{ name: 'amountOut', type: 'uint256' }]
    },
    {
      name: 'exactOutputSingle',
      type: 'function',
      stateMutability: 'payable',
      inputs: [
        {
          components: [
            { name: 'tokenIn', type: 'address' },
            { name: 'tokenOut', type: 'address' },
            { name: 'fee', type: 'uint24' },
            { name: 'recipient', type: 'address' },
            { name: 'deadline', type: 'uint256' },
            { name: 'amountOut', type: 'uint256' },
            { name: 'amountInMaximum', type: 'uint256' },
            { name: 'sqrtPriceLimitX96', type: 'uint160' }
          ],
          internalType: 'struct ISwapRouter.ExactOutputSingleParams',
          name: 'params',
          type: 'tuple'
        }
      ],
      outputs: [{ name: 'amountIn', type: 'uint256' }]
    }
  ] as const

  private getRouterAddress(chainId: number) {
    // BSC Pancake V3 router mainnet address & Base (example placeholder)
    const mapping: Record<number, string> = {
      [bsc.id]: process.env.V3_ROUTER_ADDRESS_BSC || '0xB971eF87ede563556b2ED4b1C0b0019111Dd85d2',
      [base.id]: process.env.V3_ROUTER_ADDRESS_BASE || '0x0000000000000000000000000000000000000000'
    }
    return getAddress(mapping[chainId])
  }

  private async ensureAllowance(token: string, owner: string, spender: string, minAmount: bigint) {
    const allowance = await this.client.readContract({
      address: getAddress(token),
      abi: this.ERC20_ABI,
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
        abi: this.ERC20_ABI,
        functionName: 'approve',
        args: [getAddress(spender), minAmount]
      })
      return { approvalTx: hash }
    }
    return { approvalTx: null }
  }

  async swapExactIn(params: {
    chainId?: number
    tokenIn: string
    tokenOut: string
    fee: number
    amountIn: string
    slippageBps?: number // basis points (e.g. 50 = 0.5%)
    recipient?: string
    sqrtPriceLimitX96?: string
  }) {
    if (!this.wallet) throw new Error('Wallet not initialized')
    const chainId = params.chainId || bsc.id
    const router = this.getRouterAddress(chainId)
    const account = (await this.wallet.getAddresses())[0]
    const amountInWei = BigInt(params.amountIn)
    const slippageBps = params.slippageBps ?? 50

    // For demo: set minimum out to 0 (or fetch a quote API to compute expectedOut * (1 - slippage))
    const amountOutMin = 0n

    await this.ensureAllowance(params.tokenIn, account, router, amountInWei)

    const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 10)

    const calldata = encodeFunctionData({
      abi: this.V3_SWAP_ROUTER_ABI,
      functionName: 'exactInputSingle',
      args: [
        {
          tokenIn: getAddress(params.tokenIn),
          tokenOut: getAddress(params.tokenOut),
          fee: params.fee,
          recipient: params.recipient ? getAddress(params.recipient) : account,
          deadline,
          amountIn: amountInWei,
          amountOutMinimum: amountOutMin,
          sqrtPriceLimitX96: params.sqrtPriceLimitX96 ? BigInt(params.sqrtPriceLimitX96) : 0n
        }
      ]
    })

    const hash = await this.wallet.sendTransaction({
      chain: this.wallet.chain,
      account,
      to: router,
      value: 0n,
      data: calldata
    })

    return {
      tx: hash,
      router,
      amountIn: params.amountIn,
      amountOutMin: amountOutMin.toString(),
      slippageBps
    }
  }

  async swapExactOut(params: {
    chainId?: number
    tokenIn: string
    tokenOut: string
    fee: number
    amountOut: string
    maxAmountIn: string
    recipient?: string
    sqrtPriceLimitX96?: string
  }) {
    if (!this.wallet) throw new Error('Wallet not initialized')
    const chainId = params.chainId || bsc.id
    const router = this.getRouterAddress(chainId)
    const account = (await this.wallet.getAddresses())[0]
    const amountOutWei = BigInt(params.amountOut)
    const maxAmountInWei = BigInt(params.maxAmountIn)

    await this.ensureAllowance(params.tokenIn, account, router, maxAmountInWei)

    const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 10)

    const calldata = encodeFunctionData({
      abi: this.V3_SWAP_ROUTER_ABI,
      functionName: 'exactOutputSingle',
      args: [
        {
          tokenIn: getAddress(params.tokenIn),
          tokenOut: getAddress(params.tokenOut),
          fee: params.fee,
          recipient: params.recipient ? getAddress(params.recipient) : account,
          deadline,
          amountOut: amountOutWei,
          amountInMaximum: maxAmountInWei,
          sqrtPriceLimitX96: params.sqrtPriceLimitX96 ? BigInt(params.sqrtPriceLimitX96) : 0n
        }
      ]
    })

    const hash = await this.wallet.sendTransaction({
      chain: this.wallet.chain,
      account,
      to: router,
      value: 0n,
      data: calldata
    })

    return { tx: hash, router, amountOut: params.amountOut, maxAmountIn: params.maxAmountIn }
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

  private async getDecimals(token: string): Promise<number> {
    const result = await this.client.readContract({
      address: getAddress(token),
      abi: this.ERC20_ABI,
      functionName: 'decimals'
    }) as number
    return result
  }

  private toRaw(amountDecimal: string, decimals: number): bigint {
    const [whole, frac = ''] = amountDecimal.split('.')
    if (!/^\d+$/.test(whole) || (frac && !/^\d+$/.test(frac))) {
      throw new Error('Invalid decimal amount format')
    }
    const fracPadded = (frac + '0'.repeat(decimals)).slice(0, decimals)
    return BigInt(whole + fracPadded)
  }

  async swapTokenToStable(params: {
    chainId?: number
    tokenIn: string // arbitrary token -> stable
    stable?: 'USDT' | 'USDC' | 'BUSD'
    fee: number
    amountInDecimal: string
    slippageBps?: number
    recipient?: string
  }) {
    if (!this.wallet) throw new Error('Wallet not initialized')
    const chainId = params.chainId || bsc.id
    const stableSymbol = params.stable || 'USDT'
    const stableAddress = this.STABLES[chainId]?.[stableSymbol]
    if (!stableAddress) throw new Error(`Stable ${stableSymbol} not configured for chain ${chainId}`)
    const tokenDecimals = await this.getDecimals(params.tokenIn)
    const rawAmountIn = this.toRaw(params.amountInDecimal, tokenDecimals)
    return this.swapExactIn({
      chainId,
      tokenIn: params.tokenIn,
      tokenOut: stableAddress,
      fee: params.fee,
      amountIn: rawAmountIn.toString(),
      slippageBps: params.slippageBps,
      recipient: params.recipient
    })
  }

  async swapStableToToken(params: {
    chainId?: number
    stable?: 'USDT' | 'USDC' | 'BUSD'
    tokenOut: string
    fee: number
    amountInDecimal: string
    slippageBps?: number
    recipient?: string
  }) {
    if (!this.wallet) throw new Error('Wallet not initialized')
    const chainId = params.chainId || bsc.id
    const stableSymbol = params.stable || 'USDT'
    const stableAddress = this.STABLES[chainId]?.[stableSymbol]
    if (!stableAddress) throw new Error(`Stable ${stableSymbol} not configured for chain ${chainId}`)
    const stableDecimals = await this.getDecimals(stableAddress)
    const rawAmountIn = this.toRaw(params.amountInDecimal, stableDecimals)
    return this.swapExactIn({
      chainId,
      tokenIn: stableAddress,
      tokenOut: params.tokenOut,
      fee: params.fee,
      amountIn: rawAmountIn.toString(),
      slippageBps: params.slippageBps,
      recipient: params.recipient
    })
  }
}

export default new Web3Service()