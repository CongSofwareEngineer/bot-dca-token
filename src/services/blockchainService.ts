import { createPublicClient, createWalletClient, http, parseEther, formatEther, getAddress } from 'viem'
import { bsc, mainnet } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'
import BigNumber from 'bignumber.js'
import { TokenPrice, SwapParams, DCARequest, DCAResponse } from '@/types'

// ERC-20 ABI (minimal for our needs)
const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }]
  },
  {
    name: 'symbol',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }]
  },
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  }
] as const

class BlockchainService {
  private publicClient
  private walletClient
  private account

  constructor() {
    const rpcUrl = process.env.RPC_URL || bsc.rpcUrls.default.http[0]
    const privateKey = process.env.DCA_PRIVATE_KEY

    if (!privateKey) {
      throw new Error('DCA_PRIVATE_KEY is required in environment variables')
    }

    // Validate private key format
    if (!privateKey.startsWith('0x') || privateKey.length !== 66) {
      throw new Error('DCA_PRIVATE_KEY must be a valid hex string starting with 0x and 64 characters long')
    }

    // Create public client for reading blockchain data
    this.publicClient = createPublicClient({
      chain: bsc,
      transport: http(rpcUrl)
    })

    // Create account from private key
    this.account = privateKeyToAccount(privateKey as `0x${string}`)

    // Create wallet client for transactions
    this.walletClient = createWalletClient({
      account: this.account,
      chain: bsc,
      transport: http(rpcUrl)
    })
  }

  /**
   * Get token balance
   */
  async getTokenBalance(tokenAddress: string, walletAddress?: string): Promise<string> {
    try {
      const address = walletAddress || this.account.address
      
      if (tokenAddress.toLowerCase() === '0x0' || tokenAddress.toLowerCase() === 'eth') {
        // ETH balance
        const balance = await this.publicClient.getBalance({ 
          address: getAddress(address) 
        })
        return formatEther(balance)
      } else {
        // ERC-20 token balance
        const balance = await this.publicClient.readContract({
          address: getAddress(tokenAddress),
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [getAddress(address)]
        })
        
        const decimals = await this.getTokenDecimals(tokenAddress)
        return new BigNumber(balance.toString()).dividedBy(new BigNumber(10).pow(decimals)).toString()
      }
    } catch (error: any) {
      throw new Error(`Failed to get token balance: ${error.message}`)
    }
  }

  /**
   * Get token decimals
   */
  async getTokenDecimals(tokenAddress: string): Promise<number> {
    try {
      if (tokenAddress.toLowerCase() === '0x0' || tokenAddress.toLowerCase() === 'eth') {
        return 18 // ETH decimals
      }

      const decimals = await this.publicClient.readContract({
        address: getAddress(tokenAddress),
        abi: ERC20_ABI,
        functionName: 'decimals'
      })
      
      return Number(decimals)
    } catch (error: any) {
      throw new Error(`Failed to get token decimals: ${error.message}`)
    }
  }

  /**
   * Get token symbol
   */
  async getTokenSymbol(tokenAddress: string): Promise<string> {
    try {
      if (tokenAddress.toLowerCase() === '0x0' || tokenAddress.toLowerCase() === 'eth') {
        return 'ETH'
      }

      const symbol = await this.publicClient.readContract({
        address: getAddress(tokenAddress),
        abi: ERC20_ABI,
        functionName: 'symbol'
      })
      
      return symbol as string
    } catch (error: any) {
      throw new Error(`Failed to get token symbol: ${error.message}`)
    }
  }

  /**
   * Get token price from external API (example using CoinGecko)
   */
  async getTokenPrice(tokenAddress: string): Promise<TokenPrice> {
    try {
      // This is a simple example - in production you might want to use
      // more sophisticated price feeds like Chainlink oracles
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${tokenAddress}&vs_currencies=usd`
      )
      
      if (!response.ok) {
        throw new Error('Failed to fetch token price')
      }
      
      const data = await response.json() as any
      const price = data[tokenAddress.toLowerCase()]?.usd || 0
      const symbol = await this.getTokenSymbol(tokenAddress)
      
      return {
        address: tokenAddress,
        symbol,
        price,
        priceUSD: price.toString(),
        timestamp: Date.now()
      }
    } catch (error: any) {
      throw new Error(`Failed to get token price: ${error.message}`)
    }
  }

  /**
   * Simulate DCA buy (for testing without actual transactions)
   */
  async simulateDCA(request: DCARequest): Promise<DCAResponse> {
    try {
      const { tokenAddress, amount, targetTokenAddress, slippage = 1 } = request
      
      // Get token prices
      const tokenPrice = await this.getTokenPrice(targetTokenAddress)
      const usdAmount = new BigNumber(amount)
      
      // Calculate expected token amount (simplified)
      const expectedTokenAmount = usdAmount.dividedBy(tokenPrice.price)
      const slippageAmount = expectedTokenAmount.multipliedBy(slippage / 100)
      const minTokenAmount = expectedTokenAmount.minus(slippageAmount)
      
      // Simulate transaction response
      const simulatedResponse: DCAResponse = {
        transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`, // Fake hash
        amountIn: amount,
        amountOut: minTokenAmount.toString(),
        tokenPrice: tokenPrice.priceUSD,
        gasUsed: '21000', // Estimated gas
        timestamp: Date.now()
      }
      
      return simulatedResponse
    } catch (error: any) {
      throw new Error(`DCA simulation failed: ${error.message}`)
    }
  }

  /**
   * Execute actual DCA transaction (placeholder - implement with DEX integration)
   */
  async executeDCA(request: DCARequest): Promise<DCAResponse> {
    try {
      // This is a placeholder implementation
      // In a real scenario, you would integrate with DEX protocols like:
      // - Uniswap V3
      // - 1inch
      // - Paraswap
      // - etc.
      
      console.log('Executing DCA transaction:', request)
      
      // For now, return simulation
      return await this.simulateDCA(request)
    } catch (error: any) {
      throw new Error(`DCA execution failed: ${error.message}`)
    }
  }

  /**
   * Get wallet address
   */
  getWalletAddress(): string {
    return this.account.address
  }

  /**
   * Get current gas price
   */
  async getGasPrice(): Promise<string> {
    try {
      const gasPrice = await this.publicClient.getGasPrice()
      return formatEther(gasPrice)
    } catch (error: any) {
      throw new Error(`Failed to get gas price: ${error.message}`)
    }
  }
}

export default new BlockchainService()