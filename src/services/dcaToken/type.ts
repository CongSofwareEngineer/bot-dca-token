import { Token } from '../token/type'

export interface DcaTokenConfig {
  stepSize: string; // Maximum amount to invest per trade in USD
  slippageTolerance: number; // Acceptable slippage percentage
  maxPrice: string; // Upper price limit for token purchase
  minPrice: string; // Lower price limit for token purchase
  initialCapital: string; // Initial capital allocated for DCA in USD
  isStop: boolean; // Flag to indicate if DCA is paused
  ratioPriceDrop: number; // Percentage drop in price to trigger additional investment
  listTokens: Token[]; // List of tokens to manage
}

